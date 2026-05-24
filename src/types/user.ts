export interface UserSession {
  email: string;
  phone: string;
  name?: string;
  isAdmin?: boolean;
}

export interface SavedAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export const createEmptySavedAddress = (): SavedAddress => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
});
