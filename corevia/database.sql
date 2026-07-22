-- =============================================
-- SCHEMA POSTGRESQL COMPLET
-- Généré depuis information_schema (db.json)
-- =============================================

-- =============================================
-- TYPES ENUM
-- =============================================
CREATE TYPE public.contract_type AS ENUM ('INTERNSHIP', 'CDI', 'CDD', 'FREELANCE', 'OTHER');

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE public.company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companyref TEXT NOT NULL UNIQUE,
    companyname TEXT NOT NULL,
    logo_url TEXT,
    owner_ref TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    country TEXT,
    address TEXT,
    email TEXT,
    legal_form TEXT,
    register_number TEXT,
    about TEXT,
    activity TEXT,
    expiry_date DATE,
    active_modules TEXT[],
    is_public BOOLEAN DEFAULT true,
    description TEXT
);

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TABLE public."user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userref TEXT NOT NULL UNIQUE,
    firstname TEXT NOT NULL,
    lastname TEXT,
    email TEXT UNIQUE,
    password TEXT,
    phone TEXT,
    country TEXT,
    city TEXT,
    profilephotourl TEXT,
    privilege user_role DEFAULT 'user',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clientref TEXT NOT NULL UNIQUE,
    companyname TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    companyref_owner VARCHAR NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_client_company FOREIGN KEY (companyref_owner) REFERENCES public.company(companyref)
);

CREATE TABLE public.department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deptref TEXT NOT NULL UNIQUE,
    deptname TEXT NOT NULL,
    companyref TEXT NOT NULL,
    manager_ref TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dept_company FOREIGN KEY (companyref) REFERENCES public.company(companyref),
    CONSTRAINT fk_dept_manager FOREIGN KEY (manager_ref) REFERENCES public.user(userref)
);

CREATE TYPE employe_type AS ENUM ('EMPLOYE', 'OWNER', 'MANAGER', 'HR');
CREATE TYPE contract_type AS ENUM ('CDD', 'CDI', 'INTERNSHIP');
CREATE TABLE public.employe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empref TEXT NOT NULL UNIQUE,
    userref TEXT,
    companyref VARCHAR,
    position TEXT,
    salary DOUBLE PRECISION,
    paymentday BIGINT,
    privilege employe_type DEFAULT 'EMPLOYE',
    created_at TIMESTAMP DEFAULT now(),
    is_dirigeant BOOLEAN,
    contract_url TEXT,
    medical_cert_url TEXT,
    deptref TEXT,
    hired_at TEXT,
    contrat contract_type,

    CONSTRAINT fk_employe_user FOREIGN KEY (userref) REFERENCES public."user"(userref),
    CONSTRAINT fk_employe_company FOREIGN KEY (companyref) REFERENCES public.company(companyref),
    CONSTRAINT fk_employe_dept FOREIGN KEY (deptref) REFERENCES public.department(deptref)
);

CREATE TABLE public.project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projectref TEXT NOT NULL UNIQUE,
    projectname TEXT NOT NULL,
    userref TEXT NOT NULL,
    deptref TEXT,
    companyref TEXT,
    start_date TEXT,
    end_date TEXT,
    objectives TEXT,
    expected_results TEXT,
    description TEXT,
    doc_url TEXT,
    gain TEXT,
    statut TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_client FOREIGN KEY (clientref) REFERENCES public.client(clientref),
    CONSTRAINT fk_project_dept FOREIGN KEY (deptref) REFERENCES public.department(deptref),
    CONSTRAINT fk_project_company FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teamref TEXT NOT NULL UNIQUE,
    projectref TEXT NOT NULL,
    role TEXT,
    userref TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_team_project FOREIGN KEY (projectref) REFERENCES public.project(projectref),
    CONSTRAINT fk_team_user FOREIGN KEY (userref) REFERENCES public."user"(userref)
);

CREATE TABLE public.task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taskref TEXT NOT NULL UNIQUE,
    taskname TEXT NOT NULL,
    startdate DATE,
    enddate DATE,
    status TEXT DEFAULT 'ongoing',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to BIGINT,
    task_budget NUMERIC(12,2) DEFAULT 0,
    description TEXT,

    CONSTRAINT fk_task_assigned FOREIGN KEY (assigned_to) REFERENCES public."user"(userref)
);

CREATE TABLE public.document (
    id UUID PRIMARY KEYgen_random_uuid(),
    doc_ref TEXT NOT NULL UNIQUE,
    companyref TEXT NOT NULL,
    employeeref TEXT NOT NULL,
    start_period TEXT,
    end_period TEXT NOT NULL,
    type contract_type DEFAULT 'INTERNSHIP',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    doc_url TEXT,

    CONSTRAINT fk_doc_company FOREIGN KEY (companyref) REFERENCES public.company(companyref),
    CONSTRAINT fk_doc_employe FOREIGN KEY (employeeref) REFERENCES public.employe(empref)
);

-- === Finance & Payroll ===
CREATE TABLE public.payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_tax_rate NUMERIC DEFAULT 0.22,
    employer_tax_rate NUMERIC DEFAULT 0.45,
    is_tns_regime BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payslip (
    payslip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gross_salary NUMERIC,
    net_salary NUMERIC,
    total_cost NUMERIC,
    generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref TEXT,
    companyref TEXT,
    amount NUMERIC(12,2) NOT NULL,
    label TEXT,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    account_code TEXT,
    projectref TEXT,

    CONSTRAINT fk_finance_company FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

-- === Invoicing ===
CREATE TABLE public.invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT,
    company_ref TEXT,
    client_name TEXT,
    client_email TEXT,
    project_ref TEXT,
    due_date DATE,
    status TEXT DEFAULT 'draft',
    total_ht NUMERIC DEFAULT 0,
    tva_rate NUMERIC DEFAULT 19.25,
    total_ttc NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.invoice_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    description TEXT,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    amount NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,

    CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id)
);

-- === Inventory ===
CREATE TABLE public.inventory_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref TEXT NOT NULL UNIQUE,
    companyref TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    supplier VARCHAR,
    price INTEGER,
    reduction INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    status VARCHAR,
    image TEXT,
    createdat DATE,

    CONSTRAINT fk_product_company FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.inventory_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companyref TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    store_id INTEGER,

    CONSTRAINT fk_cart_company FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.inventory_dailysales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companyref TEXT,
    nbsales INTEGER DEFAULT 0,
    totalamount NUMERIC DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- === Autres tables importantes ===
CREATE TABLE public.budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_entreprise TEXT NOT NULL,
    year INTEGER NOT NULL,
    category_key TEXT NOT NULL,
    limit_amount NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.app_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companyref TEXT,
    employeref TEXT,
    rating INTEGER,
    comment TEXT,
    category TEXT,
    createdat TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE attendance_status AS ENUM ("PRESENT", "ABSENT", "PERMISSION", "HOLYDAYS");
-- Tables restantes (structure minimale)
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    employee_id UUID, 
    companyref TEXT, 
    date DATE, 
    check_in TIMESTAMPTZ, 
    check_out TIMESTAMPTZ, 
    status TEXT attendance_status DEFAULT 'ABSENT')
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    title VARCHAR(50),
    message TEXT,
    createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.monthly_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    total_income NUMERIC, 
    total_expense NUMERIC, 
    net_profit NUMERIC, 
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des Transactions (Centralisée)
CREATE TYPE transaction_type AS ENUM ('SUBSCRIPTION', 'PAYROLL', 'TOPUP', 'WITHDRAWAL');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- 3. Table de Détail des Salaires (Lien Transaction <-> Employés)
CREATE TABLE payroll_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payref VARCHAR(50) UNIQUE NOT NULL,   -- Format: PAY-XXXX
    txref VARCHAR(50) REFERENCES transactions(txref),
    employeeref VARCHAR(50) NOT NULL,     -- Référence de l'employé
    net_salary DECIMAL(15, 2) NOT NULL,
    payment_status transaction_status DEFAULT 'PENDING',
    notified BOOLEAN DEFAULT false        -- Si l'employé a reçu un SMS/Email
);

CREATE TABLE company_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    companyref TEXT REFERENCES companies(companyref) ON DELETE CASCADE,
    method_type TEXT NOT NULL, -- 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'
    
    -- Ces champs seront stockés de manière sécurisée
    account_identifier TEXT NOT NULL, -- Numéro de téléphone OU IBAN/RIB
    provider_name TEXT,              -- 'ORANGE', 'MTN', 'AFRILAND', 'SGC'
    
    -- Pour la sécurité renforcée
    is_active BOOLEAN DEFAULT true,
    encrypted_data TEXT,             -- Champ optionnel pour stocker des tokens bancaires (Stripe/Paypal)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX idx_payment_company ON company_payment_methods(companyref);

-- ... (les autres tables comme chat_rooms, jobs, leave_requests, etc. suivent le même modèle)
