insert into businesses (
    name,
    slug
)
values (
    'Camluk Technologies',
    'camluk'
)
on conflict (slug) do nothing;


insert into services (
    business_id,
    name,
    category,
    description,
    active
)
select
    id,
    'Web Development',
    'web-development',
    'Modern websites and web applications.',
    true
from businesses
where slug = 'camluk';


insert into services (
    business_id,
    name,
    category,
    description,
    active
)
select
    id,
    'Business Software',
    'business-software',
    'Custom systems for daily operations, sales, stock, customers and reporting.',
    true
from businesses
where slug = 'camluk';


insert into services (
    business_id,
    name,
    category,
    description,
    active
)
select
    id,
    'AI & Automation',
    'ai-automation',
    'Smarter operations with less repetitive work through AI and automation.',
    true
from businesses
where slug = 'camluk';


insert into services (
    business_id,
    name,
    category,
    description,
    active
)
select
    id,
    'Cloud & Deployment',
    'cloud-deployment',
    'Cloud infrastructure, deployment and hosting solutions for digital products.',
    true
from businesses
where slug = 'camluk';