// Author: Harsh Pamnani - B00802614

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Post } from './post';
import { CreatePostService } from '../create-post.service';
import { GetPostsService } from '../get-posts.service';
import { RatingService } from '../rating.service';
import { UpdatePostService } from '../update-post.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-discussionforum',
  templateUrl: './discussionforum.component.html',
  styleUrls: ['./discussionforum.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class DiscussionforumComponent implements OnInit {
  postModel: Post = new Post('This is a new post.', 'harsh@gmail.com', 'Harsh Pamnani', 'CSCI5408', new Array(), new Date());
  postMessage: string = null;
  isErrorPresent = false;
  isSuccess = false;
  public id: string;
  public finalrate;
  // list to store overall rating and individual rating
  RatingList: any[];
  rate: any[];
  // Craeting an empty array for storing posts.
  postsList: any[] = [];
  course: any[] = [];
  postIDToUpdate: string;   // post ID for which user wants for upvote
  updatedUserList: any[];
  loggedInUserEmail: string;

  // Getting all the service in the constructor.
  constructor(
    private createPostService: CreatePostService,
    private getPostsService: GetPostsService, private route: ActivatedRoute, public ratingService: RatingService, private updatePostService: UpdatePostService
  ) {
  }

  ngOnInit() {
    this.loggedInUserEmail = localStorage.getItem('user_email');
    // This course code will be dynamically loaded for whichever course the user clicks.
    const courseCode = this.route.snapshot.paramMap.get('id');
    console.log('Client : Posts will be fetched for course code: ', courseCode);

    this.getPostsService.getPosts(courseCode.toUpperCase()).
      subscribe(
        // Receiving the data back from the service.
        data => {
          // Assigning all posts received from server to a postsList array in the component.
          this.postsList = data.Posts;
          console.log('Client : Posts fetched form server are: ', this.postsList);
        },
        // Handling the error scenario if server connection fails or any other error occurs.
        error => {
          console.log('Client : Error in connecting to server: ', error);
        }
      );

    this.getPostsService.getCourseFromCode(courseCode.toUpperCase()).
      subscribe(
        data => {
          console.log('Course fetched form server HP HP HP: ', data.Course);
          this.course = data.Course;

          // fetch the course code which is passed from the service
          this.id = this.route.snapshot.paramMap.get('id');
          // subscribe the ratingservice by passing the courseid
          this.ratingService.displayrating(this.id.toUpperCase() + ' ' + this.course['Name']).subscribe(
            data => {
              this.RatingList = data['Ratecourses'];

              // Logic to Calculate Overall rating
              // https://stackoverflow.com/questions/15496508/how-to-iterate-object-in-javascript
              var calculate = 0;
              var listsize = this.RatingList.length;
              for (var i = 0; i < this.RatingList.length; i++) {

                calculate = calculate + this.RatingList[i]['Rate'];


              }

              // Dispaly the message when there is no ratings present
              /* if(isNaN(this.finalrate))
               {
                 this.finalrate='No Ratings Available';
                 console.log("deep");
               }
               // Round off overall rating to one decimal point
               else{*/
              this.finalrate = (calculate / listsize).toFixed(1);
              //  console.log("Meet");
              // }
              // Dispaly the message when there is no ratings present
              if (isNaN(this.finalrate)) {
                console.log(this.finalrate);
                this.finalrate = 'No Ratings Available';

              }


            },
            error => {
              // Error Message when connection with server
              console.log("error in connecting to the server service", error)
            });
        },
        error => {
          console.log('Some error in connecting to server', error);
        }
      );
  }



  onSubmit(form) {
    // Retrieving post content from the form values.
    // Other attributes for post like emailId, username, postTime, and courseCode
    // will be added once the login and session management feature is implemented.
    this.postModel.postedByEmail = localStorage.getItem('user_email');
    this.postModel.postedByName = localStorage.getItem('user_name');
    this.postModel.courseCode = this.course['Code'];
    this.postModel.postContent = form.postContent;

    // Subscribing to the createPost service for validation of post and
    // creating the post in database, if all validations are successful.
    this.createPostService.createPost(this.postModel)
      .subscribe(
        data => {
          // Receiving the data back from the service.
          this.postMessage = data.responseMessage;
          console.log('Client: Response received from server is: ' + this.postMessage);

          // Checking the message from the server.
          if (this.postMessage === 'Post successfully created on discussion forum.') {
            // If response from server is successful, then adding the post to the postlist.
            const objectToAdd = Object.assign({}, this.postModel);
            this.postsList.unshift(objectToAdd);
            this.isErrorPresent = false;
            this.isSuccess = true;
            (document.getElementById('postContentTextArea') as HTMLInputElement).value = '';
          } else {
            // If there is any other response from server, setting the error flag to true
            // This situation will happend in case of validation failures.
            this.isErrorPresent = true;
            this.isSuccess = false;
          }
        },
        error => {
          // Handling the error scenario if server connection fails or any other error occurs..
          console.log('Client : Could not reach server due to error: ', error);
          this.isErrorPresent = true;
          this.isSuccess = false;
          this.postMessage = 'We could not reach our server. Please try again after some time.';
        }
      );
  }

  markHelpful(postId) {
    console.log(postId);
    var save_i;   // it will be used to re assign previous users list if operation fails in database
    for (let i = 0; i < this.postsList.length; i++) {
      if (this.postsList[i]['_id'] == postId) {
        save_i = i;
        const copy_postsList = Object.assign([], this.postsList[i]['likedByUsers']);

        // if the likes include user email, that email should be removed as the user wants to 
        // undo the rate post as helpful
        if (this.postsList[i]['likedByUsers'].includes(localStorage.getItem('user_email'))) {
          const index = this.postsList[i]['likedByUsers'].indexOf(localStorage.getItem('user_email'));
          this.postsList[i]['likedByUsers'].splice(index, 1);

          this.postIDToUpdate = postId;
          this.updatedUserList = this.postsList[i]['likedByUsers'];
        }

        else {
          this.postsList[i]['likedByUsers'].push(localStorage.getItem('user_email'));
        }
        this.updatePostService.markPostAsHelpful(postId, this.postsList[i]['likedByUsers']).subscribe(
          data => {
            console.log("SUCCESS");
            this.isErrorPresent = false;
            this.isSuccess = true;
            this.postMessage = 'Post marked as helpful';
          },
          error => {
            this.postsList[save_i]['likedByUsers'] = copy_postsList;
            console.log("SOMETHING WRONG", error);
            this.isErrorPresent = true;
            this.isSuccess = false;
            this.postMessage = 'Error while marking post as helpful. Please try again later.';
          }
        );

        break;
      }
    }
  }

}
