// API Client for Java Spring Boot Backend
const API_BASE_URL = 'http://localhost:8080';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Generic fetch wrapper with authentication
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.location.href = '/auth';
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    const errorText = await response.text();
    throw new Error(errorText || `Erro HTTP: ${response.status}`);
  }

  // Check if response has content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return {} as T;
}

// ============== AUTH API ==============
export interface LoginResponse {
  token: string;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export const authApi = {
  login: async (email: string, senha: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Email ou senha incorretos');
    }

    return response.json();
  },

  register: async (nome: string, email: string, senha: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/user/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Erro ao criar conta');
    }

    return response.json();
  },

  getProfile: async (userId: number): Promise<{ nome: string; email: string }> => {
    return fetchWithAuth(`/user/${userId}`);
  },

  updateProfile: async (userId: number, data: { nome: string; email: string }): Promise<void> => {
    return fetchWithAuth(`/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAccount: async (): Promise<void> => {
    return fetchWithAuth('/user/deletarUser', { method: 'DELETE' });
  },
};

// ============== VEICULOS API ==============
export interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  tipoVeiculo: string;
  capacidadePeso: number;
  custoPorKm: number;
  status: string;
}

export interface VeiculoInput {
  placa: string;
  modelo: string;
  tipoVeiculo: string;
  capacidadePeso: number;
  custoPorKm: number;
  status: string;
}

export const veiculosApi = {
  getAll: async (): Promise<Veiculo[]> => {
    return fetchWithAuth('/veiculos/');
  },

  getById: async (id: number): Promise<Veiculo> => {
    return fetchWithAuth(`/veiculos/${id}`);
  },

  create: async (data: VeiculoInput): Promise<Veiculo> => {
    return fetchWithAuth('/veiculos/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: VeiculoInput): Promise<Veiculo> => {
    return fetchWithAuth(`/veiculos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchWithAuth(`/veiculos/${id}`, { method: 'DELETE' });
  },
};

// ============== ROTAS API ==============
export interface Rota {
  id: number;
  origem: string;
  destino: string;
  distancia: number;
  tempoEstimadoHoras: number;
  valorPedagios: number | null;
}

export interface RotaInput {
  origem: string;
  destino: string;
  distancia: number;
  tempoEstimadoHoras: number;
  valorPedagios?: number;
}

export const rotasApi = {
  getAll: async (): Promise<Rota[]> => {
    return fetchWithAuth('/rotas/');
  },

  getById: async (id: number): Promise<Rota> => {
    return fetchWithAuth(`/rotas/${id}`);
  },

  create: async (data: RotaInput): Promise<Rota> => {
    return fetchWithAuth('/rotas/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: RotaInput): Promise<Rota> => {
    return fetchWithAuth(`/rotas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchWithAuth(`/rotas/${id}`, { method: 'DELETE' });
  },
};

// ============== CARGAS API ==============
export interface Carga {
  id: number;
  nome: string;
  peso: number;
  valor: number;
  tipo: string;
  status: string;
  descricao: string;
}

export interface CargaInput {
  nome: string;
  peso: number;
  valor: number;
  tipo: string;
  status: string;
  descricao?: string;
}

export const cargasApi = {
  getAll: async (): Promise<Carga[]> => {
    return fetchWithAuth('/cargas/');
  },

  getById: async (id: number): Promise<Carga> => {
    return fetchWithAuth(`/cargas/${id}`);
  },

  create: async (data: CargaInput): Promise<Carga> => {
    return fetchWithAuth('/cargas/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: CargaInput): Promise<Carga> => {
    return fetchWithAuth(`/cargas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchWithAuth(`/cargas/${id}`, { method: 'DELETE' });
  },
};

// ============== PEDIDO TRANSPORTE API ==============
export interface PedidoTransporte {
  id: number;
  veiculo: Veiculo;
  rota: Rota;
  carga: Carga;
  dataInicio: string;
  dataFim: string;
  status: string;
  custoTotal: number;
}

export interface PedidoTransporteInput {
  veiculoId: number;
  rotaId: number;
  cargaId: number;
  dataInicio: string;
  dataFim: string;
}

export interface PedidoTransporteUpdateInput {
  veiculo: { id: number };
  rota: { id: number };
  dataInicio: string;
  dataFim: string;
  status: string;
}

export const pedidosApi = {
  getAll: async (): Promise<PedidoTransporte[]> => {
    return fetchWithAuth('/pedido/');
  },

  getById: async (id: number): Promise<PedidoTransporte> => {
    return fetchWithAuth(`/pedido/${id}`);
  },

  create: async (data: PedidoTransporteInput): Promise<PedidoTransporte> => {
    return fetchWithAuth('/pedido/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: PedidoTransporteUpdateInput): Promise<PedidoTransporte> => {
    return fetchWithAuth(`/pedido/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchWithAuth(`/pedido/${id}`, { method: 'DELETE' });
  },
};

// Decode JWT to get user info
export function decodeToken(token: string): { sub: string; exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getUserIdFromToken(): number | null {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return parseInt(decoded.sub, 10);
}
