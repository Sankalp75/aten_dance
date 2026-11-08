-- Seed demo students + admin (optional, for testing)
insert into public.students (id, name, room, pin) values
  ('H001','Aarav Sharma','101','1234'),
  ('H002','Priya Patel','102','1234'),
  ('H003','Rohan Verma','203','1234'),
  ('H004','Sneha Iyer','204','1234'),
  ('H005','Karan Singh','305','1234')
on conflict (id) do nothing;

insert into public.admins (username, pin) values ('warden','1234')
on conflict (username) do nothing;