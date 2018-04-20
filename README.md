# Transcript Requests on the Ethereum Blockchain

## Installation

### Prerequisites

This code was developed and testing on Ubuntu 16.04 LTS.

Verify that you have the following programs (versions are to show test environment):
* git 2.7.4
* npm 5.8.0
* node 9.5.0
* Angular CLI 1.7.4
* mongoDB 3.6.3
* ganache 1.0.2
* truffle 4.0.6
* Chrome 65
* MetaMask (Chrome plugin) 4.5.5

### Setup

1. Student Server
  
   * `cd server_student`
   * `npm install`

2.  University Server

    * `cd server_transcript`
    * `npm install`

2.  Employer Server

    * `cd server_employer`
    * `npm install`
    * `cd employer-client`
    * `npm install`
    * `ng build --prod`

## Running

### Prerequisites

1. Run the Ganache client. This mocks the Ethereum blockchain so we can test the contract locally.
2. Setup MetaMask to use Ganache instead of Main Net. Follow the instructions here http://truffleframework.com/tutorials/pet-shop#interacting-with-the-dapp-in-a-browser
3. The mongod application should be running on mongodb://127.0.0.1:27017

### Student

1. In a new terminal,  run the server

    1. `cd server_student`
    2. `node app`

### University

1. In a new terminal,  run the server

    1. `cd server_transcript`
    2. `node app`

### Employer

1. In a new terminal,  run the server

    1. `cd server_employer`
    2. `node app`

## Usage

1. `Open a browser tab with localhost:3000` this is the student page
2. `Open a browser tab with localhost:4000` this is the employer page
3. The student page is filled out by default with the public key of the employer, the employers address (Ganache address #2), and the University address (Ganache address #3). These should not be changed.
4. On the student tab open the console by pressing `F12`
5. `Click the "Request Transcript" button`
6. The MetaMask Notification window should open to confirm transaction
7. `Set the Gas Price to 1 GWEI`
8. `Click Submit`
9. Several things will happen automatically

    1.  Ganache will show the "contract creation" transaction under the transactions tab
    2.  The university server terminal will show that an open contract was found, it found the student in the database, and a "Success!" message followed by the transaction data that set the transcript info on the contract
    3. Ganache will show another transaction as "contract call", this is the university setting the transcript data
    4. The employer server terminal will show that it found a relevant contract on the blockchain

10. In the employer browser tab, you can see the transcript data on display
11. **Important note:** The university server encrypts the transcript data using a combination of AES and RSA and the employer server decrypts it
