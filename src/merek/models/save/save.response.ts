export interface SaveGeneralResponse {
  status: string;
  message: string;
  data: {
    applicationNo: string;
  };
}

export interface SavePemohonResponse {
  status: string;
  message: string;
}

export interface SavePriorityResponse {
  status: string;
  message: string;
  data?: any;
}

export interface DeletePriorityResponse {
  status: string;
  message: string;
}

export interface SaveMerekResponse {
  status: string;
  message: string;
  data?: any;
}