import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import {
  TicketService,
  Ticket,
  TicketFilters,
  TicketPriority,
  TicketStatus
} from '../../../../core/services/ticket.service';

type AgentView = 'mine' | 'unassigned';

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En Curso',
  resolved: 'Resuelto',
  closed: 'Cerrado'
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  urgent: 'Urgente'
};

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css',
  standalone: false
})
export class TicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  loading = false;
  errorMessage = '';

  statuses: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
  priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

  filters: TicketFilters = { page: 1, limit: 10 };
  total = 0;

  agentView: AgentView = 'mine';

  constructor(
    public authService: AuthService,
    private ticketService: TicketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.isAgent) {
      this.filters.mine = true;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ticketService.getTickets(this.filters).subscribe({
      next: (res) => {
        this.tickets = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los tickets.';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.load();
  }

  onAgentViewChange(view: AgentView): void {
    this.agentView = view;
    this.filters.mine = view === 'mine' ? true : undefined;
    this.filters.unassigned = view === 'unassigned' ? true : undefined;
    this.onFilterChange();
  }

  goToPage(page: number): void {
    if (page < 1) return;
    this.filters.page = page;
    this.load();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority] ?? priority;
  }

  get isAgent(): boolean {
    return this.authService.hasRole('agent');
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  get canCreate(): boolean {
    return this.authService.hasRole('client', 'admin');
  }
}