import { style } from '@angular/animations';
import { Component, EventEmitter, Output } from '@angular/core';

import { Post } from '../posts.models';

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css']
})

export class PostCreateComponent {
  enteredTitle = "";
  enteredValue = "";
  @Output() postCreated = new EventEmitter<Post>();

  onAddPost() {
    const post: Post = {
      title: this.enteredTitle,
      content: this.enteredValue
    };
    this.postCreated.emit(post);
  }
}
