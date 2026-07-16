export type MarketplaceListing = {
  id: string;
  name: string;
  location: string;
  type: 'Residential' | 'Commercial' | 'Industrial' | 'Land';
  price: number;
  expectedYield: number;
  funded: number;
  minInvestment: number;
  image: string;
  tags: string[];
};

export const marketplaceListings: MarketplaceListing[] = [
  {
    id: 'MKT-001',
    name: 'Riad Al Bahia',
    location: 'Marrakesh, Morocco',
    type: 'Commercial',
    price: 1840000,
    expectedYield: 8.4,
    funded: 68,
    minInvestment: 25000,
    image:
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600',
    tags: ['Validated', 'High Yield'],
  },
  {
    id: 'MKT-002',
    name: 'Casablanca Corniche Suites',
    location: 'Casablanca, Morocco',
    type: 'Residential',
    price: 2160000,
    expectedYield: 7.2,
    funded: 42,
    minInvestment: 10000,
    image:
      'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=600',
    tags: ['New'],
  },
  {
    id: 'MKT-003',
    name: 'Agadir Bay Residences',
    location: 'Agadir, Morocco',
    type: 'Industrial',
    price: 1320000,
    expectedYield: 6.9,
    funded: 85,
    minInvestment: 50000,
    image:
      'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=600',
    tags: ['Closing Soon', 'High Yield'],
  },
  {
    id: 'MKT-004',
    name: 'Rabat Medina Lodge',
    location: 'Rabat, Morocco',
    type: 'Residential',
    price: 940000,
    expectedYield: 5.8,
    funded: 23,
    minInvestment: 5000,
    image:
      'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=600',
    tags: ['Approved'],
  },
  {
    id: 'MKT-005',
    name: 'Tangier Harbor House',
    location: 'Tangier, Morocco',
    type: 'Commercial',
    price: 1720000,
    expectedYield: 8.8,
    funded: 51,
    minInvestment: 25000,
    image:
      'https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=600',
    tags: ['High Yield'],
  },
  {
    id: 'MKT-006',
    name: 'Fes Old City Riad',
    location: 'Fes, Morocco',
    type: 'Industrial',
    price: 1260000,
    expectedYield: 6.4,
    funded: 77,
    minInvestment: 20000,
    image:
      'https://images.pexels.com/photos/2449602/pexels-photo-2449602.jpeg?auto=compress&cs=tinysrgb&w=600',
    tags: ['Validated'],
  },
];
