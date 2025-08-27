import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person, Match, QueueEntry, StartMatchRequest, EndMatchRequest, EndMatchResponse, AddToQueueRequest, PlayerRanking, AdminMatch, PlayerStats, EloRanking } from '../models/types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPersons(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.baseUrl}/persons`);
  }

  createPerson(name: string): Observable<Person> {
    return this.http.post<Person>(`${this.baseUrl}/persons`, { name });
  }

  getCurrentMatch(): Observable<Match | null> {
    return this.http.get<Match | null>(`${this.baseUrl}/matches/current`);
  }


  startMatch(request: StartMatchRequest): Observable<Match> {
    return this.http.post<Match>(`${this.baseUrl}/matches/start`, request);
  }

  startMatchFromQueue(request: { queueEntryId: number }): Observable<Match> {
    return this.http.post<Match>(`${this.baseUrl}/matches/start-from-queue`, request);
  }

  endMatch(request: EndMatchRequest): Observable<EndMatchResponse> {
    return this.http.post<EndMatchResponse>(`${this.baseUrl}/matches/end`, request);
  }

  getQueue(): Observable<QueueEntry[]> {
    return this.http.get<QueueEntry[]>(`${this.baseUrl}/queue`);
  }

  addToQueue(request: AddToQueueRequest): Observable<QueueEntry> {
    return this.http.post<QueueEntry>(`${this.baseUrl}/queue`, request);
  }

  removeFromQueue(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/queue/${id}`);
  }

  getNextFromQueue(): Observable<QueueEntry | null> {
    return this.http.get<QueueEntry | null>(`${this.baseUrl}/queue/next`);
  }

  cancelMatch(matchId: number): Observable<{ message: string; nextMatch: Match | null; progressionInfo: any }> {
    return this.http.post<{ message: string; nextMatch: Match | null; progressionInfo: any }>(`${this.baseUrl}/matches/cancel`, { matchId });
  }

  forfeitMatch(matchId: number, forfeitingTeam: number): Observable<EndMatchResponse> {
    return this.http.post<EndMatchResponse>(`${this.baseUrl}/matches/forfeit`, { matchId, forfeitingTeam });
  }

  getRankings(type?: 'singles' | 'doubles' | 'combined'): Observable<PlayerRanking[]> {
    if (type) {
      return this.http.get<PlayerRanking[]>(`${this.baseUrl}/rankings`, { params: { type } });
    } else {
      return this.http.get<PlayerRanking[]>(`${this.baseUrl}/rankings`);
    }
  }

  getEloRankings(type: 'singles' | 'doubles'): Observable<EloRanking[]> {
    return this.http.get<EloRanking[]>(`${this.baseUrl}/rankings/elo`, { params: { type } });
  }

  // Admin methods
  getAllMatches(password: string): Observable<AdminMatch[]> {
    return this.http.get<AdminMatch[]>(`${this.baseUrl}/admin/matches`, {
      headers: { 'x-admin-password': password }
    });
  }

  deleteMatch(matchId: number, password: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/admin/matches/${matchId}`, {
      headers: { 'x-admin-password': password }
    });
  }

  // Player stats
  getPlayerStats(playerId: number): Observable<PlayerStats> {
    return this.http.get<PlayerStats>(`${this.baseUrl}/player-stats/${playerId}`);
  }
}
