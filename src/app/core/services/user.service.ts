import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res) => {
        if (Array.isArray(res)) return res as User[];
        if (Array.isArray(res?.data)) return res.data as User[];
        if (Array.isArray(res?.users)) return res.users as User[];
        console.warn('Respuesta de /users con forma inesperada:', res);
        return [];
      })
    );
  }

  updateUserRole(userId: string, role: UserRole): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/role`, { role });
  }
}