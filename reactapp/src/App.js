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
          <h1>Vyber moznost</h1>
          <div>
            <form onSubmit={this.handleSubmit}> 
              <input type="submit" value={text1} onClick={this.handleButton1}/>
              <input type="submit" value={text2} onClick={this.handleButton2}/>
              <input type="submit" value={text3} onClick={this.handleButton3} />
            </form>
          </div>
        </div>
        );
    };
  }
}
 
export default App;

