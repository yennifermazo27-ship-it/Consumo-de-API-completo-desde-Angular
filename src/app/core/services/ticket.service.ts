import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  clientId: string;
  agentId?: string | null;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  agentName?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName?: string;
  message: string;
  createdAt: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  page?: number;
  limit?: number;
  mine?: boolean;
  unassigned?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  agentId?: string | null;
}

function unwrap(raw: any): any {
  let current = raw;
  for (let i = 0; i < 3; i++) {
    if (!current || typeof current !== 'object') break;
    const looksLikeTheThing = 'id' in current || '_id' in current || 'ticketId' in current || 'uuid' in current;
    if (looksLikeTheThing) break;

    let found = false;
    for (const key of ['data', 'ticket', 'comment', 'result']) {
      const inner = current[key];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        current = inner;
        found = true;
        break;
      }
    }
    if (!found) break;
  }
  return current;
}

function normalizeTicket(raw: any): Ticket {
  const src = unwrap(raw);
  const client = src.client ?? src.customer ?? null;
  const agent = src.agent ?? null;

  return {
    id: src.id ?? src._id ?? src.ticketId ?? src.ticket_id ?? src.uuid ?? '',
    title: src.title ?? '',
    description: src.description ?? '',
    status: src.status,
    priority: src.priority,
    clientId: src.clientId ?? src.client_id ?? src.userId ?? src.user_id ?? client?.id ?? '',
    clientName: src.clientName ?? client?.name ?? client?.fullName ?? undefined,
    agentId: src.agentId ?? src.agent_id ?? agent?.id ?? null,
    agentName: src.agentName ?? agent?.name ?? agent?.fullName ?? undefined,
    createdAt: src.createdAt ?? src.created_at ?? src.createdOn ?? '',
    updatedAt: src.updatedAt ?? src.updated_at ?? src.updatedOn ?? ''
  };
}

function normalizeComment(raw: any): TicketComment {
  const src = unwrap(raw);
  const author = src.author ?? src.user ?? null;
  return {
    id: src.id ?? src._id ?? '',
    ticketId: src.ticketId ?? src.ticket_id ?? '',
    authorId: src.authorId ?? src.author_id ?? src.userId ?? src.user_id ?? author?.id ?? '',
    authorName: src.authorName ?? author?.name ?? author?.fullName ?? undefined,
    message: src.message ?? src.content ?? src.text ?? src.body ?? src.comment ?? '',
    createdAt: src.createdAt ?? src.created_at ?? src.createdOn ?? ''
  };
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private readonly apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getTickets(filters: TicketFilters = {}): Observable<PaginatedResponse<Ticket>> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);
    if (filters.mine) params = params.set('mine', 'true');
    if (filters.unassigned) params = params.set('unassigned', 'true');

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => {
        const rawList = Array.isArray(res) ? res : (res?.data ?? []);
        return {
          data: rawList.map(normalizeTicket),
          total: res?.total ?? rawList.length,
          page: res?.page ?? filters.page ?? 1,
          limit: res?.limit ?? filters.limit ?? rawList.length
        } as PaginatedResponse<Ticket>;
      })
    );
  }

  getTicket(id: string): Observable<Ticket> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(normalizeTicket));
  }

  createTicket(data: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<any>(this.apiUrl, data).pipe(map(normalizeTicket));
  }

  updateTicket(id: string, data: UpdateTicketRequest): Observable<Ticket> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(map(normalizeTicket));
  }

  assignTicket(id: string, agentId: string): Observable<Ticket> {
    const base = `${this.apiUrl}/${id}`;
    const urls = [`${base}/assign`, base];
    const methods: Array<'patch' | 'post'> = ['patch', 'post'];
    const bodies = [
      { agentId },
      { agent_id: agentId },
      { assignedTo: agentId },
      { assigneeId: agentId }
    ];

    const attempts: Array<{ url: string; method: 'patch' | 'post'; body: any }> = [];
    for (const url of urls) {
      for (const method of methods) {
        for (const body of bodies) {
          attempts.push({ url, method, body });
        }
      }
    }

    const tryAt = (index: number): Observable<any> => {
      if (index >= attempts.length) {
        return throwError(() => ({ status: 400 }));
      }
      const { url, method, body } = attempts[index];
      const request$ = method === 'patch'
        ? this.http.patch<any>(url, body)
        : this.http.post<any>(url, body);

      return request$.pipe(
        catchError((err) => {
          if (err?.status === 404 || err?.status === 400) {
            return tryAt(index + 1);
          }
          return throwError(() => err);
        })
      );
    };

    return tryAt(0).pipe(map(normalizeTicket));
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getComments(ticketId: string): Observable<TicketComment[]> {
    return this.http.get<any>(`${this.apiUrl}/${ticketId}/comments`).pipe(
      map((res) => {
        const rawList = Array.isArray(res) ? res : (res?.data ?? []);
        return rawList.map(normalizeComment);
      })
    );
  }

  addComment(ticketId: string, message: string): Observable<TicketComment> {
    return this.http.post<any>(`${this.apiUrl}/${ticketId}/comments`, {
      message,
      content: message,
      text: message,
      body: message
    }).pipe(
      map(normalizeComment)
    );
  }
}