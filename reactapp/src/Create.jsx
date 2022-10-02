import React from 'react';
import App from './App';
import { StateApp } from './StateApp.ts';
import axios from "axios";



export default class Create extends React.Component {
    state = {
        value : this.props.value || StateApp.Create,
        number_of_nodes : 1,
        data : null,
        name_of_file : 'data',
    };

    handleCreateButton = event => {
        event.preventDefault();
        axios
            .get("http://127.0.0.1:8000/get_gen_file/", { params: { 'n' : this.state.number_of_nodes } })
            .then(response => {
                console.log(response.data);
                this.setState({ data : response.data });
                const element = document.createElement("a");

                const file = new Blob([ response.data ],
                    {
                    type:"text/plain;charset=utf-8"
                    });

                element.href = URL.createObjectURL(file);
                element.download = this.state.name_of_file + ".aeon";
                document.body.appendChild(element);
                element.click();
            });
    }

    handleChangeNumber = event => {
        this.setState({ number_of_nodes: event.target.value });
    }

    handleChangeName = event => {
        this.setState({ name_of_file: event.target.value });
    }

    handleBackButton = event => {
        this.setState({ value : StateApp.MainApp });
    };

    render() { 
        if (this.state.value === StateApp.MainApp) {
            return <App />;
        }
        
        return (
        <div>
            <div class="row">
                <div class="form-outline col-sm-4">
                <label class="form-label" for="typeNumber">Number of nodes</label>
                <input type="number" id="typeNumber" class="form-control"  placeholder="1" onChange={this.handleChangeNumber} min="0" />

                <label class="form-label" for="typeNumber" >Name of file</label>
                <input type="text" id="typeName" class="form-control" placeholder="data" onChange={this.handleChangeName } />
                </div>
            </div>
            <br/>
            <div class="row">
                <input class="col-sm-2" type="submit" value="Create" onClick={this.handleCreateButton} />
            </div>
            <div class="row">
                <input class="col-sm-2" type="submit" value="Back" onClick={this.handleBackButton} />
            </div>
        </div>
        );
    }
}
 