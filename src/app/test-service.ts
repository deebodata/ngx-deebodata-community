import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TestService {

  constructor(private http: HttpClient) {

  }

  getData() {
    return this.http.get("https://d2ffvluimla00s.cloudfront.net/stim_imgs_comm.json")
  }
  
}
