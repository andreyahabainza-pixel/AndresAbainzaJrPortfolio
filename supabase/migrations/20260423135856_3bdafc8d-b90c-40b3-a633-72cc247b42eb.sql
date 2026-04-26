CREATE TYPE public.app_role AS ENUM ('admin', 'cashier');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE CHECK (char_length(username) BETWEEN 3 AND 40),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  barcode TEXT NOT NULL UNIQUE CHECK (char_length(barcode) BETWEEN 3 AND 80),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_no TEXT NOT NULL UNIQUE DEFAULT ('TXN-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cashier_name TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  payment NUMERIC(12,2) NOT NULL CHECK (payment >= 0),
  change_amount NUMERIC(12,2) NOT NULL CHECK (change_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON public.transaction_items(product_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_staff_profiles_updated_at
BEFORE UPDATE ON public.staff_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view profiles"
ON public.staff_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage profiles"
ON public.staff_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view products"
ON public.products FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier'));

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view transactions"
ON public.transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR cashier_id = auth.uid());

CREATE POLICY "Staff can create transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier')) AND cashier_id = auth.uid());

CREATE POLICY "Staff can view transaction items"
ON public.transaction_items FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id AND t.cashier_id = auth.uid()
  )
);

CREATE POLICY "Staff can create transaction items"
ON public.transaction_items FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier'));

CREATE OR REPLACE FUNCTION public.verify_admin_pin(_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _stored TEXT;
BEGIN
  IF _pin !~ '^[0-9]{6}$' THEN
    RETURN FALSE;
  END IF;

  SELECT pin_hash INTO _stored
  FROM public.staff_profiles
  WHERE user_id = auth.uid();

  RETURN public.has_role(auth.uid(), 'admin') AND _stored = crypt(_pin, _stored);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_sale(
  _items JSONB,
  _payment NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item JSONB;
  _product RECORD;
  _total NUMERIC(12,2) := 0;
  _transaction_id UUID;
  _cashier_name TEXT;
  _qty INTEGER;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT full_name INTO _cashier_name FROM public.staff_profiles WHERE user_id = auth.uid();
  IF _cashier_name IS NULL THEN
    _cashier_name := 'Staff';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _qty := (_item->>'quantity')::INTEGER;
    IF _qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT * INTO _product FROM public.products WHERE id = (_item->>'product_id')::UUID FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
    IF _product.stock < _qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', _product.name;
    END IF;

    _total := _total + (_product.price * _qty);
  END LOOP;

  IF _payment < _total THEN
    RAISE EXCEPTION 'Payment is lower than total';
  END IF;

  INSERT INTO public.transactions (cashier_id, cashier_name, total, payment, change_amount)
  VALUES (auth.uid(), _cashier_name, _total, _payment, _payment - _total)
  RETURNING id INTO _transaction_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _qty := (_item->>'quantity')::INTEGER;
    SELECT * INTO _product FROM public.products WHERE id = (_item->>'product_id')::UUID FOR UPDATE;

    UPDATE public.products SET stock = stock - _qty WHERE id = _product.id;

    INSERT INTO public.transaction_items (transaction_id, product_id, product_name, quantity, price)
    VALUES (_transaction_id, _product.id, _product.name, _qty, _product.price);
  END LOOP;

  RETURN _transaction_id;
END;
$$;