import './App.css';

import React from 'react';
import LoadAeon from './LoadAeon';
import LoadJson from './LoadJson';
import Visualise from './Visualise';
import Create from './Create';

import { StateApp } from './StateApp.ts'

class App extends React.Component {
  state = {
    value : this.props.value || StateApp.Main,
  };

  handleSubmit = event => {
    event.preventDefault();
  };

  handleButton1 = event => {
    this.setState({ value : StateApp.Create });
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

      case StateApp.Create:
        return <Create />;

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
          <div class="row back height-100"></div>
          <div class="row height-200 ">
            <form onSubmit={this.handleSubmit}> 
              <input class="col-sm-3 btn btn-outline-primary  wrapper" type="submit" value={text1} onClick={this.handleButton1}/>
              <input class="col-sm-3 btn btn-outline-primary offset-1 wrapper" type="submit" value={text2} onClick={this.handleButton2}/>
              <input class="col-sm-3 btn btn-outline-primary offset-1 wrapper" type="submit" value={text3} onClick={this.handleButton3} />
            </form>
          </div>
        <div class="row back height-1000"></div>
        </div>
        );
    };
  }
}
 
export default App;

