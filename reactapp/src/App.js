import './App.css';

import React from 'react';
import LoadAeon from './LoadAeon';
import LoadJson from './LoadJson';
import Visualise from './Visualise';

import { StateApp } from './StateApp.ts'

class App extends React.Component {
  state = {
    value : this.props.value || StateApp.Main,
  };

  handleSubmit = event => {
    event.preventDefault();
  };

  handleButton1 = event => {
    window.location.assign('https://biodivine.fi.muni.cz/aeon/v0.4.0/index.html');
  }

  handleButton2 = event => {
    this.setState({ value : StateApp.LoadAeon });
  }

  handleButton3 = event => {
    this.setState({ value : StateApp.LoadJson });
  }

  handleButton4 = event => {
    this.setState({ value : StateApp.Visualise });
  }

  render() { 
    switch(this.state.value) {

      case StateApp.LoadAeon:
        return <LoadAeon />;

      case StateApp.LoadJson:
        return <LoadJson />;

      case StateApp.Visualise:
        return <Visualise />;
        
      default:
        const text1 = "Vytvor bool. siet";
        const text2 = "Nahrat siet (aeon)";
        const text3 = "Nahrat predclustrovanu siet (json)";

        return (
        <div>
          <div class="row height-100"></div>
          <div class="row height-200 ">
            <form onSubmit={this.handleSubmit}> 

            <div class="col-lg-4 btn wrapper" value={text1} onClick={this.handleButton1} >
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-server" viewBox="0 0 16 16">
                <path d="M1.333 2.667C1.333 1.194 4.318 0 8 0s6.667 1.194 6.667 2.667V4c0 1.473-2.985 2.667-6.667 2.667S1.333 5.473 1.333 4V2.667z"/>
                <path d="M1.333 6.334v3C1.333 10.805 4.318 12 8 12s6.667-1.194 6.667-2.667V6.334a6.51 6.51 0 0 1-1.458.79C11.81 7.684 9.967 8 8 8c-1.966 0-3.809-.317-5.208-.876a6.508 6.508 0 0 1-1.458-.79z"/>
                <path d="M14.667 11.668a6.51 6.51 0 0 1-1.458.789c-1.4.56-3.242.876-5.21.876-1.966 0-3.809-.316-5.208-.876a6.51 6.51 0 0 1-1.458-.79v1.666C1.333 14.806 4.318 16 8 16s6.667-1.194 6.667-2.667v-1.665z"/>
              </svg>
              <br/>
              <h3 class="wrapperh3">Go to Aeon</h3>
              <p>Redirection to AEON, where is possible to create .aeon file, which can be used in next steps.</p>
            </div>

            <div class="col-lg-4 btn wrapper" value={text2} onClick={this.handleButton2} >
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-files" viewBox="0 0 16 16">
                <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
              </svg>
              <br/>
              <h3 class="wrapperh3">Import Aeon file</h3>
              <p>Import of file in .aeon format, which can be further processed with choosing type of Boolean network and starting state.</p>
            </div>
            
            <div class="col-lg-4 btn wrapper" value={text3} onClick={this.handleButton3} >
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-filetype-json" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM4.151 15.29a1.176 1.176 0 0 1-.111-.449h.764a.578.578 0 0 0 .255.384c.07.049.154.087.25.114.095.028.201.041.319.041.164 0 .301-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .084-.29.387.387 0 0 0-.152-.326c-.101-.08-.256-.144-.463-.193l-.618-.143a1.72 1.72 0 0 1-.539-.214 1.001 1.001 0 0 1-.352-.367 1.068 1.068 0 0 1-.123-.524c0-.244.064-.457.19-.639.128-.181.304-.322.528-.422.225-.1.484-.149.777-.149.304 0 .564.05.779.152.217.102.384.239.5.41.12.17.186.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.246-.181.923.923 0 0 0-.37-.068c-.216 0-.387.05-.512.152a.472.472 0 0 0-.185.384c0 .121.048.22.144.3a.97.97 0 0 0 .404.175l.621.143c.217.05.406.12.566.211a1 1 0 0 1 .375.358c.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Zm-3.104-.033a1.32 1.32 0 0 1-.082-.466h.764a.576.576 0 0 0 .074.27.499.499 0 0 0 .454.246c.19 0 .33-.055.422-.164.091-.11.137-.265.137-.466v-2.745h.791v2.725c0 .44-.119.774-.357 1.005-.237.23-.565.345-.985.345a1.59 1.59 0 0 1-.568-.094 1.145 1.145 0 0 1-.407-.266 1.14 1.14 0 0 1-.243-.39Zm9.091-1.585v.522c0 .256-.039.47-.117.641a.862.862 0 0 1-.322.387.877.877 0 0 1-.47.126.883.883 0 0 1-.47-.126.87.87 0 0 1-.32-.387 1.55 1.55 0 0 1-.117-.641v-.522c0-.258.039-.471.117-.641a.87.87 0 0 1 .32-.387.868.868 0 0 1 .47-.129c.177 0 .333.043.47.129a.862.862 0 0 1 .322.387c.078.17.117.383.117.641Zm.803.519v-.513c0-.377-.069-.701-.205-.973a1.46 1.46 0 0 0-.59-.63c-.253-.146-.559-.22-.916-.22-.356 0-.662.074-.92.22a1.441 1.441 0 0 0-.589.628c-.137.271-.205.596-.205.975v.513c0 .375.068.699.205.973.137.271.333.48.589.626.258.145.564.217.92.217.357 0 .663-.072.917-.217.256-.146.452-.355.589-.626.136-.274.205-.598.205-.973Zm1.29-.935v2.675h-.746v-3.999h.662l1.752 2.66h.032v-2.66h.75v4h-.656l-1.761-2.676h-.032Z"/>
              </svg>
              <br/>
              <h3 >Import Json file</h3>
              <p>Import of fine in .json format, which was created by this aplication. Without further description, this file is processed to final visualisation.</p>
            </div>
              
            </form>
          </div>
        </div>
        );
    };
  }
}
 
export default App;

