import React from 'react';
import App from './App';
import { StateApp } from './StateApp.ts';


export default class Create extends React.Component {

    handleBackButton = event => {
        this.setState({ value : StateApp.MainApp });
    };

    render() { 
        if (this.state.value === StateApp.MainApp) {
            return <App />;
        }
        
        return (
        <div>
            <h3>Here will be place to create bool net</h3>
            <input type="submit" value="Back" onClick={this.handleBackButton} />
        </div>
        );
    }
}
 