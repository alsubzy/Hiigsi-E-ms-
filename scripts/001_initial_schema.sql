-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users with role information)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('admin', 'teacher', 'accountant', 'staff')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create students table
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  roll_number text not null unique,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  email text,
  phone text,
  address text,
  grade text not null,
  section text not null,
  admission_date date not null,
  parent_name text not null,
  parent_phone text not null,
  parent_email text,
  blood_group text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create attendance table
create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  notes text,
  marked_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(student_id, date)
);

-- Create subjects table
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  grade text not null,
  created_at timestamp with time zone default now()
);

-- Create grades table
create table if not exists public.grades (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  term text not null,
  marks decimal(5,2) not null check (marks >= 0 and marks <= 100),
  grade text,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(student_id, subject_id, term)
);

-- Create fee_structure table
create table if not exists public.fee_structure (
  id uuid primary key default uuid_generate_v4(),
  grade text not null,
  fee_type text not null,
  amount decimal(10,2) not null,
  frequency text not null check (frequency in ('monthly', 'quarterly', 'yearly', 'one-time')),
  created_at timestamp with time zone default now()
);

-- Create payments table
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount decimal(10,2) not null,
  fee_type text not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'bank_transfer', 'cheque', 'online')),
  transaction_id text,
  payment_date date not null,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_students_grade on public.students(grade);
create index if not exists idx_students_section on public.students(section);
create index if not exists idx_students_status on public.students(status);
create index if not exists idx_attendance_date on public.attendance(date);
create index if not exists idx_attendance_student_id on public.attendance(student_id);
create index if not exists idx_grades_student_id on public.grades(student_id);
create index if not exists idx_grades_term on public.grades(term);
create index if not exists idx_payments_student_id on public.payments(student_id);
create index if not exists idx_payments_date on public.payments(payment_date);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.subjects enable row level security;
alter table public.grades enable row level security;
alter table public.fee_structure enable row level security;
alter table public.payments enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for students (all authenticated users can read, only admin/staff can write)
create policy "Authenticated users can view students"
  on public.students for select
  using (auth.uid() is not null);

create policy "Admin and staff can insert students"
  on public.students for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'staff')
    )
  );

create policy "Admin and staff can update students"
  on public.students for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'staff')
    )
  );

create policy "Admin can delete students"
  on public.students for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for attendance
create policy "Authenticated users can view attendance"
  on public.attendance for select
  using (auth.uid() is not null);

create policy "Teachers and admin can mark attendance"
  on public.attendance for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'teacher', 'staff')
    )
  );

create policy "Teachers and admin can update attendance"
  on public.attendance for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'teacher', 'staff')
    )
  );

-- RLS Policies for subjects
create policy "Authenticated users can view subjects"
  on public.subjects for select
  using (auth.uid() is not null);

create policy "Admin can manage subjects"
  on public.subjects for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for grades
create policy "Authenticated users can view grades"
  on public.grades for select
  using (auth.uid() is not null);

create policy "Teachers and admin can insert grades"
  on public.grades for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'teacher')
    )
  );

create policy "Teachers and admin can update grades"
  on public.grades for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'teacher')
    )
  );

-- RLS Policies for fee_structure
create policy "Authenticated users can view fee structure"
  on public.fee_structure for select
  using (auth.uid() is not null);

create policy "Admin can manage fee structure"
  on public.fee_structure for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for payments
create policy "Authenticated users can view payments"
  on public.payments for select
  using (auth.uid() is not null);

create policy "Accountant and admin can record payments"
  on public.payments for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'accountant')
    )
  );

create policy "Accountant and admin can update payments"
  on public.payments for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'accountant')
    )
  );
