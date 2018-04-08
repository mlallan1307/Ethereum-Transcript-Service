import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { NgZone } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { Subscription } from 'rxjs/Rx';

import * as socketIo from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  private socket;
  tsData: any[] = []; 

  constructor() {
    this.initSocket().subscribe(data => {
      console.log(data);
      this.tsData = Object.values(data);
    });
  }

  ngOnInit() {
  }

  initSocket() {
    const obs = new Observable<Object>(observer => {
      this.socket = socketIo("http://localhost:4001/");
      this.socket.on('transcripts', (data) => {
        observer.next(data);
      });
    })
    return obs;
  }


}
