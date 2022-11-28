import './App.css';

import React from 'react';
import LoadAeon from './LoadAeon';
import LoadJson from './LoadJson';
import Visualise from './Visualise';

import { StateApp } from './StateApp.ts';
import ExclaimIcon from './Icons/ExclaimIcon';
import App from './App';


class WrongFile extends React.Component {
    state = {
        value : this.props.value || StateApp.Wrong_file
    };

    handleBackButton = event => {
        this.setState({ value : StateApp.MainApp });
    };


    render() { 

        if (this.state.value === StateApp.MainApp) {
            return <App />;
        }

        return <div class="row">
        <div class="col-4-lg btn wrapper"></div>
        <div class="col-4-lg btn wrapper">
            <ExclaimIcon />
            <h3 class="wrapperh3">Wrong file format</h3>
            <p>Expected file format: <b>{this.props.expected}</b></p>
        </div>
        <div class="row">
              <div class="col-lg-2">
                <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
              </div>
            </div>
        <div class="col-4-lg btn wrapper"></div>
    </div>
    }
}
 
export default WrongFile;

