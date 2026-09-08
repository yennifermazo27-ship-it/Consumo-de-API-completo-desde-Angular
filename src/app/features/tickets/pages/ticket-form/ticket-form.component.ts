import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TicketService, Ticket, TicketPriority, TicketStatus } from '../../../../core/services/ticket.service';

@Component({
  selector: 'app-ticket-form',
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.css',
  standalone: false
})
export class TicketFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  loading = false;
  errorMessage = '';
  isEdit = false;
  ticketId: string | null = null;
  ticket: Ticket | null = null;

  isAdmin = false;
  isAgent = false;

  priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
  statuses: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

  form: FormGroup = this.fb.group({});

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.ticketId;
    this.isAdmin = this.authService.hasRole('admin');
    this.isAgent = this.authService.hasRole('agent');

    this.buildForm();

    if (this.isEdit && this.ticketId) {
      this.ticketService.getTicket(this.ticketId).subscribe((t) => {
        if (this.isAgent && t.agentId !== this.authService.currentUser?.id) {
          this.router.navigate(['/tickets', t.id]);
          return;
        }
        this.ticket = t;
        this.form.patchValue(t as any);
      });
    }
  }

  private buildForm(): void {
    if (!this.isEdit) {
      this.form = this.fb.group({
        title: ['', Validators.required],
        description: ['', Validators.required],
        priority: ['medium' as TicketPriority, Validators.required]
      });
      return;
    }

    if (this.isAdmin) {
      this.form = this.fb.group({
        title: ['', Validators.required],
        description: ['', Validators.required],
        priority: ['medium' as TicketPriority, Validators.required],
        status: ['open' as TicketStatus, Validators.required]
      });
      return;
    }

    this.form = this.fb.group({
      status: ['open' as TicketStatus, Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const value = this.form.getRawValue();

    const request$ = this.isEdit && this.ticketId
      ? this.ticketService.updateTicket(this.ticketId, value)
      : this.ticketService.createTicket(value);

    request$.subscribe({
      next: (ticket) => {
        this.loading = false;
        this.router.navigate(['/tickets', ticket.id]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.error?.message || 'No se pudo guardar el ticket.';
      }
    });
  }
}