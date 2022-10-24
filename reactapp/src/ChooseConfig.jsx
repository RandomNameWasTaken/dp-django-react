import './App.css';
import React from 'react';
import Visualise from './Visualise';
import { StateApp } from './StateApp.ts';
import axios from "axios";


let param_arguments = {};
let param_lines = {};

class ChooseConfig extends React.Component {
  state = {
    value : this.props.value || StateApp.ChooseConfig,

    checked_nodes : [],

    compute: false,
    asked : false,

    param_arguments: {},

    param_count : 1,
  };


   handleCheckSyntax = (event) => {
      const name = event.currentTarget.id;
      const element = event.target;
      const parent_id = element.closest("ul").getAttribute("id").split('_');
      param_arguments[parent_id[1]][name] = event.target.value; // TODO syntax check
    };

    handleBackButton = event => {
      this.setState({ value : StateApp.LoadAeon });
    };

    handleNodesButton = event => {
      event.preventDefault();
      this.render();

      this.setState({ compute : true });

      if (this.state.params !== undefined) {
        for (var c = 0; c < this.state.param_count; ++c) {
          this.state.params.forEach((value, key) => {
            
            const expresion_arr = value["expr"].split("___parametrization___");
            var expr_snd = '';
            if (expresion_arr.length > 1) {
              expr_snd = expresion_arr[1];
            }

            if (param_lines[c] === undefined) {
              param_lines[c] = []
            }

            param_lines[c].push( "$" + key + " : " + expresion_arr[0] + " " + param_arguments[c][key] + " " + expr_snd );
          });
        }
        console.log(param_lines);
      }
    };

     handleOnChange = (event, name) => {
      var checked = this.state.checked_nodes;

      if (event.target.checked) {
        checked.push(name);
      } else {
        checked = checked.filter(function(value) {
          return value === name;
        });
      }
      this.setState({ checked_nodes: checked });
    };

    handleNoSave = () => {
      this.setState({ asked : true });
    }

    handleSave = () => {
      const element = document.createElement("a");

      const file = new Blob([this.state.clusters],
        {
          type:"text/plain;charset=utf-8"
        });

      element.href = URL.createObjectURL(file);
      element.download = "data.json";
      document.body.appendChild(element);
      element.click();

      this.setState({ asked : true });
    }

    addParam = (event) => {
      event.preventDefault();
      this.setState({ param_count : this.state.param_count + 1 });
    }

  render() { 

    if (this.state.value === StateApp.Visualise) {

          // Ask to save data
          const clusters_parsed = JSON.parse(this.state.clusters);

          if (this.state.asked === true) {
            return <Visualise fileData={clusters_parsed} />;
          }
          return (
            <div>
              <div class="row height-100"></div>
              <div class="row height-200 ">
                <form onSubmit={this.handleSubmit}> 

                <div class="col-lg-6 btn wrapper" onClick={this.handleSave} >
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  <br/>
                  <h3 class="wrapperh3">Download</h3>
                  <p>Download precomputed clusters as JSON file.</p>
                </div>

                <div class="col-lg-6 btn wrapper" onClick={this.handleNoSave} >
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-arrow-right-square" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                  </svg>
                  <br/>
                  <h3 class="wrapperh3">Only visualize</h3>
                  <p>Only visualise without saving precomputed data.</p>
                </div>

                </form>
              </div>
            </div>
                      
          );
    }  

    if (!this.state.nodes) {
        axios
            .get("http://127.0.0.1:8000/get_nodes")
            .then(response => {
                const result = JSON.parse(response.data);
                this.setState({ nodes : result["nodes"] });

                if (result["parametrization"] !== undefined) {
                    this.setState({ params : new Map(Object.entries(result["parametrization"])), reguls : result["regulations"] });
                }

            });
        return (
            <h3>Getting nodes</h3>
        );
    }

    if (this.state.nodes && this.state.compute === false) {

        var parametrization_selection;
        const counts = Array.from(Array(this.state.param_count).keys());

        if (this.state.params !== undefined) {

          counts.forEach((c) => {
            if (param_arguments[c] === undefined) {
              param_arguments[c] = {};
            }
          });

          var lis = [];
          this.state.params.forEach((value, name) => {
            const args = value["args"].split(',');

            lis.push(
                <li key={name}>
                  <b>{name}</b>:
                  <br/>
                  <i>expression</i>: {value["expr"]}
                  <br/>
                  <i>can be parametrized by:</i> {value["args"]}
                  <br/>
                  <input type="text" name={name} id={name} onChange={this.handleCheckSyntax}/>
                </li>);
          });

            parametrization_selection = <div className="App">
                                            <h3>Add parametrization</h3>
                                            <p>
                                              Your expression will be added instead of '___parametrization___'.
                                            </p>
                                            <div class="row">
                                            {
                                              counts.map(c => {
                                                return (
                                                <div class="col">
                                                  <ul id={'param_' + c}>
                                                    {
                                                      lis.map(li => {
                                                        return li;
                                                      }, this)
                                                    }
                                                  </ul>
                                                </div>);
                                              }, this)
                                            }
                                            
                                            <button class="col" onClick={this.addParam}> + </button>
                                            </div>
                                          </div>
            }
    }

    if (!this.state.parsed_nodes_keys || this.state.parsed_nodes_keys === null) {
        const nodes_keys = Object.keys(this.state.nodes);
        this.setState({parsed_nodes_keys : nodes_keys});
    }

    if (this.state.parsed_nodes_keys && this.state.compute === false) {

        const nodes_selection = <div className="App">
                                <h3>Select nodes</h3>
                                {this.state.parsed_nodes_keys.map(name => {
                                    return (
                                    <div>
                                        <input
                                        type="checkbox"
                                        id={`custom-checkbox-${name}`}
                                        name={name}
                                        value={name}
                                        onChange={ (event) => { this.handleOnChange(event, name) }}
                                        />
                                        <label htmlFor={`custom-checkbox-${name}`}>{name}</label>
                                    </div>
                                    );
                                })}
                            </div>;
    

        return (
            <div>
            <form>
                {nodes_selection}
                {parametrization_selection}
                <input type="submit" value="Send" onClick={this.handleNodesButton} />
            </form>
            </div>
        );                      
    }

    if (this.state.compute) {
        const result_data_joined = this.props.file_read.join(" %% ");

        document.cookie = "resultData=" + result_data_joined + "; SameSite=None; Secure";

        const nodes = this.state.checked_nodes.join(',');

        var data_params = {
            semantics: (this.props.async ? (this.props.sync ? "async,sync" : "async") : "sync"),
            nodes: nodes
        }
        
        if (param_lines !== {}) {
            const param_lines_json = JSON.stringify(param_lines);
            data_params['params'] = param_lines_json;              
        }

        axios
            .get("http://127.0.0.1:8000/get_data/", { params: data_params })
            .then(response => {
                this.setState({ clusters : response.data });
                this.setState({ value : StateApp.Visualise });
            });
        
        return (
        <div>
            <h3>Sending request</h3>
        </div>
        );
    }        
          
    return (
    <div>
        <h3>Waiting for computation</h3>
    </div>
    );

  }
}
 
export default ChooseConfig;

