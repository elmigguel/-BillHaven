// In a real application, this would likely involve a more complex logic,
// potentially reading from a route configuration.
// For this project, we'll use a simple mapping consistent with App.jsx.

const pageUrlMap = {
  Home: '/',
  Dashboard: '/dashboard',
  SubmitBill: '/submit-bill',
  MyBills: '/my-bills',
  ReviewBills: '/review-bills',
  FeeStructure: '/fee-structure',
  PublicBills: '/public-bills',
  Settings: '/settings',
  DisputeAdmin: '/dispute-admin',
  Referral: '/referral',
  Login: '/login',
  Signup: '/signup',
};

export const createPageUrl = (pageName) => {
  return pageUrlMap[pageName] || '/';
};