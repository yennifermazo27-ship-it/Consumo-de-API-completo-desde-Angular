import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { TicketService, Ticket, TicketComment } from '../../../../core/services/ticket.service';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
  standalone: false
})
export class TicketDetailComponent implements OnInit {
  ticketId = '';

  ticket: Ticket | null = null;
  comments: TicketComment[] = [];
  newComment = '';

  loading = false;
  errorMessage = '';
  deleting = false;

  allUsers: User[] = [];
  agents: User[] = [];
  selectedAgentId = '';

  assignFeedback = '';
  assignFeedbackIsError = false;
  commentFeedback = '';
  commentFeedbackIsError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private userService: UserService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ticketId = id;
      this.load(id);
    }

    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  load(id: string): void {
    this.loading = true;
    this.ticketService.getTicket(id).subscribe({
      next: (t) => {
        this.ticket = t;
        this.selectedAgentId = t.agentId || '';
        this.loading = false;
        this.loadComments(id);
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el ticket.';
        this.loading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.agents = users.filter((u) => u.role === 'agent');
      },
      error: (err) => {
        this.assignFeedback = 'No se pudo cargar la lista de usuarios: ' + this.describeError(err);
        this.assignFeedbackIsError = true;
      }
    });
  }

  loadComments(id: string): void {
    this.ticketService.getComments(id).subscribe({
      next: (c) => (this.comments = c),
      error: (err) => {
        this.commentFeedback = 'No se pudieron cargar los comentarios: ' + this.describeError(err);
        this.commentFeedbackIsError = true;
      }
    });
  }

  addComment(): void {
    if (!this.ticketId || !this.newComment.trim()) return;
    this.commentFeedback = '';

    this.ticketService.addComment(this.ticketId, this.newComment.trim()).subscribe({
      next: () => {
        this.newComment = '';
        this.commentFeedback = 'Comentario agregado.';
        this.commentFeedbackIsError = false;
        this.loadComments(this.ticketId);
      },
      error: (err) => {
        this.commentFeedback = 'No se pudo agregar el comentario: ' + this.describeError(err);
        this.commentFeedbackIsError = true;
      }
    });
  }

  assignAgent(): void {
    if (!this.ticketId || !this.selectedAgentId) return;
    this.assignFeedback = '';

    this.ticketService.assignTicket(this.ticketId, this.selectedAgentId).subscribe({
      next: () => {
        this.assignFeedback = 'Agente asignado correctamente.';
        this.assignFeedbackIsError = false;
        this.load(this.ticketId);
      },
      error: () => {
        this.assignFeedback = 'No se pudo asignar el agente.';
        this.assignFeedbackIsError = true;
      }
    });
  }

  goToEdit(): void {
    if (this.ticketId) this.router.navigate(['/tickets', this.ticketId, 'edit']);
  }

  deleteTicket(): void {
    if (!this.ticketId) return;
    const confirmed = confirm('¿Seguro que quieres eliminar este ticket? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    this.deleting = true;
    this.ticketService.deleteTicket(this.ticketId).subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: (err) => {
        this.deleting = false;
        alert('No se pudo eliminar el ticket: ' + this.describeError(err));
      }
    });
  }

  private describeError(err: any): string {
    if (err?.status === 0) return 'no se pudo conectar con la API (revisa el proxy o CORS).';
    if (err?.error?.error?.message) return `${err.status} - ${err.error.error.message}`;
    if (err?.error?.message) return `${err.status} - ${err.error.message}`;
    if (err?.status) return `código ${err.status}`;
    return 'error desconocido';
  }

  get clientName(): string {
    if (!this.ticket) return 'Desconocido';
    if (this.ticket.clientName) return this.ticket.clientName;
    return this.resolveUserName(this.ticket.clientId);
  }

  get agentName(): string {
    if (!this.ticket?.agentId) return 'Sin asignar';
    if (this.ticket.agentName) return this.ticket.agentName;
    return this.resolveUserName(this.ticket.agentId);
  }

  private resolveUserName(userId: string): string {
    const found = this.allUsers.find((u) => u.id === userId);
    if (found) return found.name;

    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.id === userId) return currentUser.name;

    return 'Desconocido';
  }

  get canEdit(): boolean {
    if (!this.ticket) return false;
    if (this.authService.hasRole('admin')) return true;
    if (this.authService.hasRole('agent')) return this.ticket.agentId === this.authService.currentUser?.id;
    return false;
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }
}