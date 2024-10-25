import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { MatTableModule } from '@angular/material/table'; // Import necessary Material modules
import { dummyImages } from './dummyImages';

interface Image {
  id: string;
  filename: string;
  href: string;
  publishedStatus: string;
}

@Component({
  selector: 'app-images',
  standalone: true, // Mark this component as standalone
  imports: [CommonModule, MatTableModule, HttpClientModule], // Import necessary modules here
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css'],
})
export class ImagesComponent implements OnInit {
  displayedColumns: string[] = [
    'id',
    'filename',
    'href',
    'publishedStatus',
    'action',
  ];
  dataSource: Image[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchImages();
  }

  publishImage(id: string): void {
    // Implement your publish logic here
    console.log(`Publishing image with ID: ${id}`);
    // You can also dispatch an action or make an API call here
  }

  fetchImages(): void {
    // console.log('Fetching images...'); // Debug line
    // this.http.get<Image[]>('http://ticketing.dev/api/images').subscribe(
    //   (data) => {
    //     console.log('Images fetched:', data); // Debug line
    //     this.dataSource = data;
    //   },
    //   (error) => {
    //     console.error('Error fetching images:', error); // Debug line
    //   }
    // );
    this.dataSource = dummyImages;
  }
}
