import './App.css';
import React from 'react';
import Visualise from './Visualise';
import App from './App';
import LoadAeon from './LoadAeon';
import { StateApp } from './StateApp.ts';
import axios from "axios";

import CoffeeIcon from './Icons/CoffeeIcon';
import DownloadIcon from './Icons/DownloadIcon';
import OnlyVisualiseIcon from './Icons/OnlyVisualiseIcon';
import CloseIcon from './Icons/CloseIcon';
import ExclaimIcon from './Icons/ExclaimIcon';
import PlusIcon from './Icons/PlusIcon';
import MinusIcon from './Icons/MinusIcon';
import SendIcon from './Icons/SendIcon';


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
    isOpen: false,
    shouldHide: [],
  };

   handleCheckSyntax = (event) => {
      const name = event.currentTarget.id;
      const element = event.target;
      const parent_id = element.closest("ul").getAttribute("id").split('_');
      param_arguments[parent_id[1]][name] = event.target.value; // TODO syntax check
      
      if (this.state.number_of_nodes === undefined) {
        this.setState({ number_of_nodes : Object.keys(this.state.nodes).length });
      }

      const line = param_arguments[parent_id[1]][name];

      if (line.length === 0) {
        element.classList = [];
      } else {
        axios
          .get("http://127.0.0.1:8000/check_syntax", { params:
              {
                line : line,
                nodes: this.state.nodes,
                n : this.state.number_of_nodes,
                } })
          .then(response => {
            if (response.data === true) {
              element.classList = ['greenshadow'];
            } else {
              element.classList = ['redshadow'];
            }
        });
      }
    };

    handleBackButton = event => {
      this.setState({ value : StateApp.LoadAeon });
    };

    handleNodesButton = event => {

      const greens = document.getElementsByClassName('greenshadow');
      if (this.state.params !== undefined && greens.length !== this.state.param_count * this.state.params.size) {
        this.openModal();
        return;
      }

      event.preventDefault();
      this.setState({ compute : true });

      if (this.state.params !== undefined) {
        for (let c = 0; c < this.state.param_count; ++c) {
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

    hideParam = (event, c) => {
      event.preventDefault();
      var shouldHide = this.state.shouldHide;
      shouldHide[c] = true;
      this.setState({ shouldHide: shouldHide, param_count : this.state.param_count - 1 });
    }

    openModal = (event) => {
      this.setState({ isOpen : true });
    }

    closeModal = (event) => {
      this.setState({ isOpen : false });
    }

  render() {

    if (this.state.value === StateApp.MainApp) {
      return <App />
    }

    if (this.state.value === StateApp.LoadAeon) {
      return <LoadAeon />
    }

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
                  <DownloadIcon />
                  <br/>
                  <h3 class="wrapperh3">Download</h3>
                  <p>Download precomputed clusters as JSON file.</p>
                </div>

                <div class="col-lg-6 btn wrapper" onClick={this.handleNoSave} >
                  <OnlyVisualiseIcon />
                  <br/>
                  <h3 class="wrapperh3">Only visualize</h3>
                  <p>Only visualise without saving precomputed data.</p>
                </div>

                </form>
              </div>
            </div>
                      
          );
    }  

    if (!this.state.nodes && this.props.file_read) {
        const data_params = {
          file_data : this.props.file_read.join(" %% "),
        };

        axios
            .get("http://127.0.0.1:8000/get_nodes", { params: data_params })
            .then(response => {
                const result = JSON.parse(response.data);
                this.setState({ nodes : result["nodes"] });

                if (result["parametrization"] !== undefined) {
                    this.setState({ params : new Map(Object.entries(result["parametrization"]))});
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

          if (this.state.shouldHide === undefined) {
            this.setState({ shouldHide : counts.map( x => false ) });
          }

          if (this.state.shouldHide.length < counts.length) {
            for (let i = 0; i < counts.length - this.state.shouldHide.length; i++) {
                this.state.shouldHide.push(false);
            }
          }

          var lis = [];
          this.state.params.forEach((value, name) => {
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
                                            <div class="row back">
                                            {
                                              counts.map(c => {
                                                var minus;
                                                if (c === counts.length - 1 && c !== 0) {
                                                  minus = (
                                                    <span class="col-lg-1" title="Delete parametrization" onClick={(e) => this.hideParam(e, c)} >
                                                      <MinusIcon />
                                                    </span>
                                                  );
                                                }

                                                return (
                                                <div class="col back" className={this.state.shouldHide[c] === true ? 'hidden' : undefined}>
                                                  <h5>
                                                    No. {c + 1} &nbsp; {minus}
                                                  </h5>
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
                                              <div class="col-lg-1" onClick={this.addParam} title="Add parametrization" >
                                                <PlusIcon />
                                              </div>
                                            </div>
                                          </div>
            }
    }

    if (this.state.nodes && (!this.state.parsed_nodes_keys || this.state.parsed_nodes_keys === null)) {
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
                                        class="cblack"
                                        />
                                        <label htmlFor={`custom-checkbox-${name}`}>&nbsp;{name}</label>
                                    </div>
                                    );
                                })}
                            </div>;
    

        return (
            <div class="back">

              {this.state.isOpen &&
                  <div>
                    <div class="overlay_styles"/>
                    <div class="modal_styles">
                      <div class="row centeredTopRight" onClick={this.closeModal}>
                        <CloseIcon />
                      </div>

                      <div class="row">
                        <div class="col-3">
                          <ExclaimIcon />
                        </div>
                        <div class="col-6">
                          Some parametrizations are not written correctly.
                        </div>
                      </div>
                    </div>
                  </div>
              }
              <form>
                  {nodes_selection}
                  {parametrization_selection}

              </form>
              <br/>
                <div class="row">
                  <div className="App">
                    <button type="submit" value="Send" class="center btn-dark btn-sm btn " onClick={this.handleNodesButton} >
                      <SendIcon />&nbsp;Send
                    </button>
                  </div>
                  </div>
              <div class="row back">
                <div class="col-lg-2">
                  <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
                </div>
              </div>
            </div>
        );                      
    }

    if (this.state.compute) {
        const result_data_joined = this.props.file_read.join(" %% ");

        const nodes = this.state.checked_nodes.join(',');
        var data_params = {
            file_data: result_data_joined,
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
        <div class="row">
          <div class="col-4-lg btn wrapper"></div>
          <div class="col-4-lg btn wrapper">
              <CoffeeIcon />
              <h3 class="wrapperh3">Sending request</h3>
          </div>
          <div class="col-4-lg btn wrapper"></div>
        </div>
        );
    }        
          
    return (
    <div class="row">
      <div class="col-4-lg btn wrapper"></div>
      <div class="col-4-lg btn wrapper">
          <CoffeeIcon />
          <h3 class="wrapperh3">Waiting for computation</h3>
      </div>
      <div class="col-4-lg btn wrapper"></div>
    </div>
    );


  }
}
 
export default ChooseConfig;

