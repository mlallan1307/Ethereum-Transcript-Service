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
  private socket;
  tsData: any[] = []; 

  constructor() {
    this.socket = socketIo("http://localhost:4000/");
    this.socket.on('transcripts', (data) => {
      this.tsData = Object.values(data);
    });
  }

  ngOnInit() {
  }

}
