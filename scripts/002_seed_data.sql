-- Insert default subjects for different grades
insert into public.subjects (name, code, grade) values
  ('Mathematics', 'MATH-1', '1'),
  ('English', 'ENG-1', '1'),
  ('Science', 'SCI-1', '1'),
  ('Social Studies', 'SS-1', '1'),
  ('Mathematics', 'MATH-2', '2'),
  ('English', 'ENG-2', '2'),
  ('Science', 'SCI-2', '2'),
  ('Social Studies', 'SS-2', '2'),
  ('Mathematics', 'MATH-3', '3'),
  ('English', 'ENG-3', '3'),
  ('Science', 'SCI-3', '3'),
  ('Social Studies', 'SS-3', '3'),
  ('Physical Education', 'PE-3', '3'),
  ('Mathematics', 'MATH-4', '4'),
  ('English', 'ENG-4', '4'),
  ('Science', 'SCI-4', '4'),
  ('Social Studies', 'SS-4', '4'),
  ('Physical Education', 'PE-4', '4'),
  ('Mathematics', 'MATH-5', '5'),
  ('English', 'ENG-5', '5'),
  ('Science', 'SCI-5', '5'),
  ('Social Studies', 'SS-5', '5'),
  ('Physical Education', 'PE-5', '5')
on conflict (code) do nothing;

-- Insert default fee structure
insert into public.fee_structure (grade, fee_type, amount, frequency) values
  ('1', 'Tuition Fee', 5000.00, 'monthly'),
  ('1', 'Activity Fee', 500.00, 'monthly'),
  ('1', 'Transport Fee', 1500.00, 'monthly'),
  ('2', 'Tuition Fee', 5500.00, 'monthly'),
  ('2', 'Activity Fee', 500.00, 'monthly'),
  ('2', 'Transport Fee', 1500.00, 'monthly'),
  ('3', 'Tuition Fee', 6000.00, 'monthly'),
  ('3', 'Activity Fee', 600.00, 'monthly'),
  ('3', 'Transport Fee', 1500.00, 'monthly'),
  ('4', 'Tuition Fee', 6500.00, 'monthly'),
  ('4', 'Activity Fee', 600.00, 'monthly'),
  ('4', 'Transport Fee', 1500.00, 'monthly'),
  ('5', 'Tuition Fee', 7000.00, 'monthly'),
  ('5', 'Activity Fee', 700.00, 'monthly'),
  ('5', 'Transport Fee', 1500.00, 'monthly')
on conflict do nothing;

-- Insert sample students
insert into public.students (
  roll_number, first_name, last_name, date_of_birth, gender, 
  email, phone, address, grade, section, admission_date,
  parent_name, parent_phone, parent_email, blood_group, status
) values
  ('2025001', 'John', 'Smith', '2015-03-15', 'male', 'john.smith@email.com', '555-0101', 
   '123 Main St', '4', 'A', '2024-04-01', 'Robert Smith', '555-0201', 'robert.smith@email.com', 'O+', 'active'),
  ('2025002', 'Emma', 'Johnson', '2015-07-22', 'female', 'emma.johnson@email.com', '555-0102', 
   '456 Oak Ave', '4', 'A', '2024-04-01', 'Michael Johnson', '555-0202', 'michael.j@email.com', 'A+', 'active'),
  ('2025003', 'Oliver', 'Brown', '2016-01-10', 'male', 'oliver.brown@email.com', '555-0103', 
   '789 Pine Rd', '3', 'B', '2024-04-01', 'David Brown', '555-0203', 'david.brown@email.com', 'B+', 'active'),
  ('2025004', 'Sophia', 'Davis', '2016-05-18', 'female', 'sophia.davis@email.com', '555-0104', 
   '321 Elm St', '3', 'A', '2024-04-01', 'James Davis', '555-0204', 'james.davis@email.com', 'AB+', 'active'),
  ('2025005', 'Liam', 'Wilson', '2017-09-25', 'male', 'liam.wilson@email.com', '555-0105', 
   '654 Maple Dr', '2', 'B', '2024-04-01', 'William Wilson', '555-0205', 'william.w@email.com', 'O-', 'active')
on conflict (roll_number) do nothing;
