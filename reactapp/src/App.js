import './App.css';

import React from 'react';
import LoadAeon from './LoadAeon';
import LoadJson from './LoadJson';
import Visualise from './Visualise';

import { StateApp } from './StateApp.ts';
import ServerIcon from './Icons/ServerIcon';
import JsonIcon from './Icons/JsonIcon';
import AeonFileIcon from './Icons/AeonFileIcon';

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
              <ServerIcon />
              <br/>
              <h3 class="wrapperh3">Go to Aeon</h3>
              <p>Redirection to AEON, where is possible to create <i>.aeon</i> file, which can be used in next steps.</p>
            </div>

            <div class="col-lg-4 btn wrapper" value={text2} onClick={this.handleButton2} >
              <AeonFileIcon />
              <br/>
              <h3 class="wrapperh3">Import Aeon file</h3>
              <p>Import of file in <i>.aeon</i> format, which can be further processed with choosing type of Boolean network and starting state.</p>
            </div>
            
            <div class="col-lg-4 btn wrapper" value={text3} onClick={this.handleButton3} >
              <JsonIcon />
              <br/>
              <h3 >Import Json file</h3>
              <p>Import of fine in <i>.json</i> format, which was created by this aplication. Without further description, this file is processed to final visualisation.</p>
            </div>
            </form>
          </div>
        </div>
        );
    };
  }
}
 
export default App;

