import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AdminMatch } from '../../models/types';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  isAuthenticated = false;
  password = '';
  matches: AdminMatch[] = [];
  loading = false;
  error: string | null = null;
  authError = '';
  showDeleteModal = false;
  matchToDelete: AdminMatch | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Check if already authenticated in session storage
    const savedAuth = sessionStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      this.isAuthenticated = true;
      this.loadMatches();
    }
  }

  authenticate(): void {
    if (this.password === 'tfcz3000') {
      this.isAuthenticated = true;
      this.authError = '';
      sessionStorage.setItem('admin_authenticated', 'true');
      this.loadMatches();
    } else {
      this.authError = 'Falsches Passwort';
    }
  }

  logout(): void {
    this.isAuthenticated = false;
    this.password = '';
    this.matches = [];
    this.authError = '';
    this.error = null;
    sessionStorage.removeItem('admin_authenticated');
  }

  loadMatches(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getAllMatches('tfcz3000').subscribe({
      next: (matches) => {
        this.matches = matches;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Fehler beim Laden der Spiele';
        this.loading = false;
        console.error('Error loading matches:', error);
      }
    });
  }

  deleteMatch(match: AdminMatch): void {
    if (match.isActive) {
      this.error = 'Aktive Spiele können nicht gelöscht werden';
      return;
    }

    this.matchToDelete = match;
    this.showDeleteModal = true;
  }

  confirmDeleteMatch(): void {
    if (!this.matchToDelete) return;

    this.apiService.deleteMatch(this.matchToDelete.id, 'tfcz3000').subscribe({
      next: () => {
        this.loadMatches(); // Reload the list
        this.closeDeleteModal();
      },
      error: (error) => {
        this.error = 'Fehler beim Löschen des Spiels';
        this.closeDeleteModal();
        console.error('Error deleting match:', error);
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.matchToDelete = null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('de-DE');
  }

  getMatchResult(match: AdminMatch): string {
    if (match.isActive) {
      return 'Läuft';
    }
    if (!match.winner) {
      return 'Abgebrochen';
    }
    return `${match.winner} gewinnt`;
  }
}
