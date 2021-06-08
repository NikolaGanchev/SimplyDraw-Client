# SimplyDraw

## Intro

SimplyDraw is a website that allows you, as the name suggests, to simply draw. No pop ups. No home pages. No registrations. No downloading apps. No tracking and half-screen-taking cookie notices (because there are no cookies). Just you, a canvas and tools. When you finish, you just download your canvas as a .png. Browser-side until you decide it shouldn't be. Then, you can draw with friends, or just about anyone. When you create a room, you are the host. You can mute members (people that joined the room) or mute everyone by default. You can disband the room or kick people. Everyone else is a member, who can watch and draw, unless you mute them. Then, they can only watch. Simple, right? And if your connection dies mid drawing, the first member to join inherits the room and becomes the host. You can rejoin as a member and continue drawing. Even if you get disconnected, you can just download your work.

## URL

<https://simplydraw.netlify.com>

## Author

Nikola Ganchev

## Features

### Drawing

Just drag your mouse to draw

### Changing color

You can use the preselected colors or use the color picker to choose your own

### Edit line width

You can use the dropdown or just write out the line width

### Edit line style

You can choose the line style in the dropdown from one of three options

### Erase

You can use the eraser to erase

### Clear

You can clear the whole canvas using the clear button

### Undo

You can undo an action using the undo button

### Redo

You can redo an action you undid by using the redo button

### Fill

You can fill using the fill button

### Rooms

You can use rooms to draw with other people

#### Create room

Create a room after passing a Captcha challenge. You will be presented with a menu to change your name (by default host), disband your room, mute new members by default and your room code. Share your room code with other people so they can join.

##### Muting and kicking as host

As the host of a room you can mute and kick members, by pressing their avatar on the right and selecting an option. Muted members can't draw, but they can still see what others are drawing

##### Mute by default

As the host, you can check the mute by default option. If you activate it, anyone new that joins the room will instantly be muted.

#### Join room

Join a room after passing a Captcha challenge. You will be presented with a menu to change your name, input the code of the room you are trying to join, a join button and a leave button that is active while you are in a room

### Downloading

You can use the download button to download your work when you finish.

## Remaining

I worked on this project for more than a month, however it wasn't enough to finish everything I had in mind. The remaining is to decouple components from the app itself (Like NumberInput.tsx, despite the name suggesting that it is a reusable component is directly tied to the line width change event), generalize some components (like ResponsiveContentModal and a few others sharing about 80% of their code) and somehow break up the NetworkContext.tsx (because 653 lines of code are too much). As far as new features go, I would finish up the resize functionality between the host and client (essentially a canvas ratio sync), which is implemented up to the resize event that is used in Board.tsx, so a all that remains is a single function to di the actual sync after receiving the ratio from the host. If I ever have the time, I may revisit this project to fix these issues. For now, I'm open sourcing it and launching it.
