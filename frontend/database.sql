CREATE TYPE "Plans" AS ENUM ('PRO', 'BASIC', 'ENTERPRISE');
CREATE TYPE "Contract_type" AS ENUM ('INTERNSHIP', 'CDI', 'CDD');
CREATE TYPE "transaction_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE public.payroll_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    legal_form text NOT NULL,
    country text DEFAULT 'Cameroon'::text,
    employee_tax_rate numeric DEFAULT 0.22,
    employer_tax_rate numeric DEFAULT 0.45,
    is_tns_regime boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payroll_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE public.company (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    companyref text NOT NULL UNIQUE,
    companyname text NOT NULL,
    logo_url text,
    owner_ref text NOT NULL, -- Clé étrangère ajoutée par ALTER TABLE plus bas
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    country text,
    address text,
    email text,
    phone text,
    legal_form text, -- Remplacé USER-DEFINED par text
    register_number text,
    about text,
    activity text,
    expiry_date date DEFAULT (CURRENT_DATE + '7 days'::interval),
    active_modules text[], -- Remplacé ARRAY par text[]
    is_public boolean DEFAULT true,
    description text,
    plan text NOT NULL DEFAULT 'PRO'::text, -- Remplacé USER-DEFINED par text
    CONSTRAINT company_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    userref text NOT NULL UNIQUE,
    firstname text NOT NULL,
    lastname text NOT NULL,
    email text NOT NULL UNIQUE,
    password text NOT NULL,
    country text,
    city text,
    profilephotourl text,
    privilege text DEFAULT 'user'::text,
    phone text,
    CONSTRAINT user_pkey PRIMARY KEY (id)
);

ALTER TABLE "user" ADD COLUMN createdat timestamp with time zone DEFAULT now();

-- Ajout de la clé étrangère circulaire pour le propriétaire de l'entreprise
ALTER TABLE public.company ADD CONSTRAINT company_owner_fkey FOREIGN KEY (owner_ref) REFERENCES public.user(userref);

CREATE TABLE public.department (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    deptref text NOT NULL UNIQUE,
    deptname text NOT NULL,
    companyref text NOT NULL,
    manager_ref text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT department_pkey PRIMARY KEY (id),
    CONSTRAINT dept_company_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref),
    CONSTRAINT dept_manager_fkey FOREIGN KEY (manager_ref) REFERENCES public.user(userref)
);

CREATE TABLE public.employe (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Converti en uuid
    empref text NOT NULL UNIQUE,
    userref text,
    companyref text,
    position text,
    salary double precision,
    paymentday bigint,
    privilege text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    is_dirigeant boolean,
    contract_url text,
    medical_cert_url text,
    deptref text,
    hired_at text,
    contrat text, -- Remplacé USER-DEFINED par text
    CONSTRAINT employe_pkey PRIMARY KEY (id),
    CONSTRAINT employe_userref_fkey FOREIGN KEY (userref) REFERENCES public.user(userref),
    CONSTRAINT employe_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.client (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    clientref text NOT NULL UNIQUE,
    companyname text NOT NULL,
    contact_name text,
    contact_email text,
    contact_phone text,
    address text,
    companyref_owner text NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT client_pkey PRIMARY KEY (id),
    CONSTRAINT fk_client_company FOREIGN KEY (companyref_owner) REFERENCES public.company(companyref)
);

CREATE TABLE public.project (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    projectref text NOT NULL UNIQUE,
    projectname text NOT NULL,
    userref text NOT NULL,
    deptref text,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    clientref text,
    end_date text,
    objectives text,
    expected_results text,
    companyref text,
    description text,
    start_date text,
    doc_url text,
    budget double precision,
    gain text,
    statut text,
    CONSTRAINT project_pkey PRIMARY KEY (id),
    CONSTRAINT fk_project_client FOREIGN KEY (clientref) REFERENCES public.client(clientref),
    CONSTRAINT project_userref_fkey FOREIGN KEY (userref) REFERENCES public.user(userref),
    CONSTRAINT project_dept_fkey FOREIGN KEY (deptref) REFERENCES public.department(deptref),
    CONSTRAINT project_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.task (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    taskref text NOT NULL UNIQUE,
    taskname text NOT NULL,
    startdate date,
    enddate date,
    status text DEFAULT 'ongoing'::text,
    projectref text NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_to bigint, -- Conservé en bigint car fait référence à un ID externe spécifique ou quantité, non lié à l'ID UUID employé
    task_budget numeric DEFAULT 0,
    description text,
    CONSTRAINT task_pkey PRIMARY KEY (id),
    CONSTRAINT task_projectref_fkey FOREIGN KEY (projectref) REFERENCES public.project(projectref)
);

CREATE TABLE public.team (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    teamref text NOT NULL UNIQUE,
    projectref text NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role text,
    userref text,
    CONSTRAINT team_pkey PRIMARY KEY (id),
    CONSTRAINT team_projectref_fkey FOREIGN KEY (projectref) REFERENCES public.project(projectref),
    CONSTRAINT team_userref_fkey FOREIGN KEY (userref) REFERENCES public.user(userref)
);

CREATE TABLE public.collaborator (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    collabref text NOT NULL UNIQUE,
    userref text NOT NULL,
    teamref text NOT NULL,
    role text,
    CONSTRAINT collaborator_pkey PRIMARY KEY (id),
    CONSTRAINT collaborator_teamref_fkey FOREIGN KEY (teamref) REFERENCES public.team(teamref),
    CONSTRAINT collaborator_userref_fkey FOREIGN KEY (userref) REFERENCES public.user(userref)
);

CREATE TABLE public.assignments (
    assref text NOT NULL,
    collabref text NOT NULL,
    taskref text NOT NULL,
    dateassigned timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    userref text,
    CONSTRAINT assignments_pkey PRIMARY KEY (assref),
    CONSTRAINT assignments_collabref_fkey FOREIGN KEY (collabref) REFERENCES public.collaborator(collabref),
    CONSTRAINT assignments_taskref_fkey FOREIGN KEY (taskref) REFERENCES public.task(taskref),
    CONSTRAINT assignments_userref_fkey FOREIGN KEY (userref) REFERENCES public.user(userref)
);

CREATE TABLE public.notifications (
    notifref text NOT NULL,
    title text NOT NULL,
    content text,
    isread boolean DEFAULT false,
    userref text NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_pkey PRIMARY KEY (notifref),
    CONSTRAINT notifications_userref_fkey FOREIGN KEY (userref) REFERENCES public.user(userref)
);

CREATE TABLE public.document (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    doc_ref text NOT NULL UNIQUE,
    companyref text NOT NULL,
    employeeref text NOT NULL,
    start_period text,
    end_period text NOT NULL,
    type text DEFAULT 'INTERNSHIP'::text, -- Remplacé USER-DEFINED par text
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    doc_url text,
    CONSTRAINT document_pkey PRIMARY KEY (id),
    CONSTRAINT document_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref),
    CONSTRAINT document_employeeref_fkey FOREIGN KEY (employeeref) REFERENCES public.employe(empref)
);

CREATE TABLE public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Converti en uuid
    employee_id uuid, -- Modifié en uuid pour correspondre à employe.id
    companyref text,
    date date DEFAULT CURRENT_DATE,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    status text DEFAULT 'present'::text,
    CONSTRAINT attendance_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employe(id)
);

CREATE TABLE public.leave_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Converti en uuid
    employee_id uuid, -- Modifié en uuid pour correspondre à employe.id
    employee_name text,
    companyref text,
    type text,
    start_date date,
    end_date date,
    duration_days integer,
    reason text,
    status text DEFAULT 'en_attente'::text,
    created_at timestamp with time zone DEFAULT now(),
    request_ref text NOT NULL UNIQUE,
    CONSTRAINT leave_requests_pkey PRIMARY KEY (id),
    CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employe(id)
);

CREATE TABLE public.project_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Converti en uuid
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    project_ref text,
    author_ref text,
    content text,
    progress_at_time double precision,
    company_ref text,
    CONSTRAINT project_reports_pkey PRIMARY KEY (id),
    CONSTRAINT project_reports_author_ref_fkey FOREIGN KEY (author_ref) REFERENCES public.user(userref)
);

CREATE TABLE public.chat_rooms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ref text NOT NULL UNIQUE,
    name text,
    type text NOT NULL, -- Remplacé USER-DEFINED par text
    company_ref text,
    project_ref text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_rooms_pkey PRIMARY KEY (id),
    CONSTRAINT chat_rooms_company_ref_fkey FOREIGN KEY (company_ref) REFERENCES public.company(companyref)
);

CREATE TABLE public.chat_participants (
    room_ref text NOT NULL,
    user_ref text NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_participants_pkey PRIMARY KEY (room_ref, user_ref),
    CONSTRAINT chat_participants_room_ref_fkey FOREIGN KEY (room_ref) REFERENCES public.chat_rooms(ref),
    CONSTRAINT chat_participants_user_ref_fkey FOREIGN KEY (user_ref) REFERENCES public.user(userref)
);

CREATE TABLE public.chat_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    message_ref text NOT NULL UNIQUE,
    room_ref text,
    sender_ref text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
    CONSTRAINT chat_messages_room_ref_fkey FOREIGN KEY (room_ref) REFERENCES public.chat_rooms(ref),
    CONSTRAINT chat_messages_sender_ref_fkey FOREIGN KEY (sender_ref) REFERENCES public.user(userref)
);

CREATE TABLE public.finance_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    transaction_ref text NOT NULL UNIQUE,
    companyref text NOT NULL,
    amount numeric NOT NULL,
    label text NOT NULL,
    category text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text,
    account_code text,
    projectref text,
    CONSTRAINT finance_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT fk_finance_company FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.payslip (
    payslip_id uuid NOT NULL DEFAULT gen_random_uuid(),
    employe_ref text,
    company_ref text,
    month_year text,
    gross_salary numeric,
    net_salary numeric,
    total_cost numeric,
    status text DEFAULT 'draft'::text,
    generated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payslip_pkey PRIMARY KEY (payslip_id),
    CONSTRAINT payslip_employe_ref_fkey FOREIGN KEY (employe_ref) REFERENCES public.employe(empref)
);

CREATE TABLE public.invoices (
    invoice_id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_number text NOT NULL UNIQUE,
    company_ref text,
    client_name text NOT NULL,
    client_email text,
    project_ref text,
    due_date date,
    status text DEFAULT 'draft'::text,
    total_ht numeric DEFAULT 0,
    tva_rate numeric DEFAULT 19.25,
    total_ttc numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id),
    CONSTRAINT invoices_company_ref_fkey FOREIGN KEY (company_ref) REFERENCES public.company(companyref),
    CONSTRAINT invoices_project_ref_fkey FOREIGN KEY (project_ref) REFERENCES public.project(projectref)
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    item_id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_id uuid,
    description text NOT NULL,
    quantity numeric DEFAULT 1,
    unit_price numeric DEFAULT 0,
    amount numeric DEFAULT 0,
    CONSTRAINT invoice_items_pkey PRIMARY KEY (item_id),
    CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id)
);

CREATE TABLE public.payroll_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Converti en uuid
    employee_id uuid, -- Modifié en uuid pour correspondre à employe.id
    companyref text,
    employee_name text,
    month text,
    base_salary numeric,
    net_salary numeric,
    created_at timestamp with time zone DEFAULT now(),
    absences_count integer DEFAULT 0,
    absence_deduction numeric DEFAULT 0,
    social_charges numeric DEFAULT 0,
    employee_userref text,
    CONSTRAINT payroll_history_pkey PRIMARY KEY (id),
    CONSTRAINT payroll_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employe(id)
);

CREATE TABLE public.monthly_closings (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Converti en uuid
    companyref text,
    closing_month text,
    total_income numeric,
    total_expense numeric,
    net_profit numeric,
    closed_by text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT monthly_closings_pkey PRIMARY KEY (id)
);

CREATE TABLE public.jobs (
    jobref text NOT NULL,
    title text NOT NULL,
    description text,
    type text CHECK (type = ANY (ARRAY['recrutement'::text, 'evenement'::text])),
    location text,
    salary_range text,
    deadline date,
    companyref text,
    created_at timestamp with time zone DEFAULT now(),
    file_url text,
    created_by text,
    CONSTRAINT jobs_pkey PRIMARY KEY (jobref),
    CONSTRAINT jobs_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.applications (
    appref text NOT NULL,
    jobref text,
    firstname text,
    lastname text,
    email text,
    resume_url text,
    status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'accepted'::text, 'rejected'::text])),
    applied_at timestamp with time zone DEFAULT now(),
    contract_url text,
    candidate_ref text,
    CONSTRAINT applications_pkey PRIMARY KEY (appref),
    CONSTRAINT applications_jobref_fkey FOREIGN KEY (jobref) REFERENCES public.jobs(jobref)
);

CREATE TABLE public.saved_jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    userref text,
    jobref text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT saved_jobs_pkey PRIMARY KEY (id),
    CONSTRAINT saved_jobs_jobref_fkey FOREIGN KEY (jobref) REFERENCES public.jobs(jobref)
);

CREATE TABLE public.inventory_products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ref text NOT NULL,
    companyref text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    summary text NOT NULL,
    description text NOT NULL,
    supplier text,
    price integer NOT NULL,
    reduction integer DEFAULT 0,
    stock integer DEFAULT 0,
    status text,
    image text,
    createdat date DEFAULT CURRENT_DATE,
    CONSTRAINT inventory_products_pkey PRIMARY KEY (id)
);

CREATE TABLE public.inventory_stores (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    companyref text,
    store_name text NOT NULL,
    location text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    owner_id uuid, -- Modifié en uuid pour correspondre à user.id
    owner_ref text,
    ref text NOT NULL,
    activity text,
    opening_hour text,
    close_hour text,
    country text,
    city text,
    remainingactivationtime bigint,
    imageUrl text,
    CONSTRAINT inventory_stores_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.user(id),
    CONSTRAINT inventory_stores_owner_ref_fkey FOREIGN KEY (owner_ref) REFERENCES public.user(userref)
);

CREATE TABLE public.inventory_carts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    companyref text NOT NULL,
    amount integer NOT NULL,
    date timestamp with time zone DEFAULT now(),
    store_id uuid, -- Modifié en uuid pour correspondre à inventory_stores.id
    CONSTRAINT inventory_carts_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_carts_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref),
    CONSTRAINT inventory_carts_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.inventory_stores(id)
);

CREATE TABLE public.inventory_orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    cartid uuid, -- Modifié en uuid pour correspondre à inventory_carts.id
    productid uuid, -- Modifié en uuid pour correspondre à inventory_products.id
    quantity integer NOT NULL,
    unitprice integer NOT NULL,
    reduction integer DEFAULT 0,
    total numeric NOT NULL,
    date date DEFAULT CURRENT_DATE,
    store_id uuid NOT NULL, -- Modifié en uuid pour correspondre à inventory_stores.id
    CONSTRAINT inventory_orders_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_orders_cartid_fkey FOREIGN KEY (cartid) REFERENCES public.inventory_carts(id),
    CONSTRAINT inventory_orders_productid_fkey FOREIGN KEY (productid) REFERENCES public.inventory_products(id)
);

CREATE TABLE public.inventory_dailysales (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    companyref text NOT NULL,
    nbsales integer DEFAULT 0,
    totalamount numeric DEFAULT 0,
    date date NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT inventory_dailysales_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_dailysales_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.subscription_renewals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    companyref text NOT NULL,
    userplan text NOT NULL,
    capture text NOT NULL,
    status text DEFAULT 'pending'::text,
    createdat date DEFAULT CURRENT_DATE,
    CONSTRAINT subscription_renewals_pkey PRIMARY KEY (id),
    CONSTRAINT subscription_renewals_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.app_feedbacks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    companyref text,
    employeref text,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    comment text,
    category text,
    createdat timestamp with time zone DEFAULT now(),
    CONSTRAINT app_feedbacks_pkey PRIMARY KEY (id),
    CONSTRAINT app_feedbacks_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);

CREATE TABLE public.robot_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    role text NOT NULL,
    activity text NOT NULL,
    status text NOT NULL,
    error_details text,
    screenshot_url text,
    company_name text,
    CONSTRAINT robot_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.budget_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ref_entreprise text NOT NULL,
    year integer NOT NULL,
    category_key text NOT NULL,
    limit_amount numeric NOT NULL DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT budget_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE public.presentations (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Remplacé uuid_generate_v4() par gen_random_uuid()
    title text,
    company_ref text,
    created_by text,
    theme_config jsonb,
    updated_at text,
    CONSTRAINT presentations_pkey PRIMARY KEY (id),
    CONSTRAINT presentations_company_ref_fkey FOREIGN KEY (company_ref) REFERENCES public.company(companyref),
    CONSTRAINT presentations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user(userref)
);

CREATE TABLE public.slides (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Remplacé uuid_generate_v4() par gen_random_uuid()
    presentation_id uuid,
    order_index integer,
    background_config jsonb,
    elements jsonb,
    transition text,
    CONSTRAINT slides_pkey PRIMARY KEY (id),
    CONSTRAINT slides_presentation_id_fkey FOREIGN KEY (presentation_id) REFERENCES public.presentations(id)
);

CREATE TABLE public.wallets (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Remplacé uuid_generate_v4() par gen_random_uuid()
    walletref text NOT NULL UNIQUE,
    companyref text NOT NULL,
    balance numeric DEFAULT 0.00 CHECK (balance >= 0::numeric),
    currency text DEFAULT 'XAF'::text,
    is_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT wallets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Remplacé uuid_generate_v4() par gen_random_uuid()
    txref text NOT NULL UNIQUE,
    walletref text,
    companyref text NOT NULL,
    userref text NOT NULL,
    amount numeric NOT NULL,
    fee numeric DEFAULT 0.00,
    type text NOT NULL, -- Remplacé USER-DEFINED par text
    status text DEFAULT 'PENDING'::text, -- Remplacé USER-DEFINED par text
    payment_method text,
    provider_external_id text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    gateway_provider text,
    gateway_status text,
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_walletref_fkey FOREIGN KEY (walletref) REFERENCES public.wallets(walletref)
);

CREATE TABLE public.payroll_details (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Remplacé uuid_generate_v4() par gen_random_uuid()
    payref text NOT NULL UNIQUE,
    txref text,
    employeeref text NOT NULL,
    net_salary numeric NOT NULL,
    payment_status text DEFAULT 'PENDING'::text, -- Remplacé USER-DEFINED par text
    notified boolean DEFAULT false,
    CONSTRAINT payroll_details_pkey PRIMARY KEY (id),
    CONSTRAINT payroll_details_txref_fkey FOREIGN KEY (txref) REFERENCES public.transactions(txref)
);

CREATE TABLE public.company_payment_methods (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Remplacé uuid_generate_v4() par gen_random_uuid()
    companyref text,
    method_type text NOT NULL,
    account_identifier text NOT NULL,
    provider_name text,
    is_active boolean DEFAULT true,
    encrypted_data text,
    created_at timestamp with time zone DEFAULT now(),
    is_primary boolean,
    CONSTRAINT company_payment_methods_pkey PRIMARY KEY (id),
    CONSTRAINT company_payment_methods_companyref_fkey FOREIGN KEY (companyref) REFERENCES public.company(companyref)
);