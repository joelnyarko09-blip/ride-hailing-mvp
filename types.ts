
export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN'
}

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  MINIVAN = 'MINIVAN',
  TRUCK = 'TRUCK'
}

export enum TripMode {
  SHARE_SAVE = 'SHARE_SAVE',
  PRIVATE = 'PRIVATE'
}

export enum TripStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  PICKUP = 'PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  waitTime: number; // in minutes
  isCompleted: boolean;
}

export interface Trip {
  id: string;
  passengerId: string;
  driverId?: string;
  stops: Stop[];
  vehicleType: VehicleType;
  mode: TripMode;
  status: TripStatus;
  fare: number;
  distanceKm: number;
  createdAt: string;
  etaMinutes?: number;
  isTradeTrip: boolean;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  isOnline: boolean;
  vehicle: {
    type: VehicleType;
    plate: string;
  };
  location: {
    lat: number;
    lng: number;
  };
}
