import React from 'react';
import App from './App';
import { StateApp } from './StateApp.ts';
import Visualise from './Visualise';
import axios from "axios";

let param_arguments = {};

function get_select_fun(fun, name) {
  return (
    <select name={name} id={name} onClick={fun}>
      <option value="&"> & </option>
      <option value="|"> | </option>
      <option value="->"> -&gt; </option>
      <option value="<=>"> &lt;=&gt; </option>
    </select>
  );
}

function choose_parametrization(fun, args, regulations, nodes, name) {
  var result = [];
  args.forEach(function (arg, index) {
    if (result.length > 0) {
      result.push(get_select_fun(fun, name + "_" + index))
    }

    if (regulations[nodes[name]][nodes[arg]] === '-') {
      result.push('!')
    }

    result.push(arg)
  });

  return result.map(arg => { return arg; });
}

export default class LoadAeon extends React.Component {
    state = {
        value : this.props.value || StateApp.LoadAeon,
        selectedFile: null,

        option: null,

        json_data:null,
        checked_nodes : [],

        parsed_nodes_keys: null,
        nodes: null,

        compute: false,
        clusters: null,
        asked : false,

        param_arguments: {},
    };
  //  const [param_arguments, set_param_arguments] = useState();

    onFileChange = event => {
        // Update the state
        this.setState({ selectedFile: event.target.files[0] });
    };

    handleParams = (event) => {
      const id_arr = event.currentTarget.id.split('_');
      const name = id_arr[0];
      const index = id_arr[1];

      param_arguments[name][index - 1] = "|";
    };

    // On file upload (click the upload button)
    onFileUpload = () => {
          const file = this.state.selectedFile;
  
          var reader = new FileReader();
          reader.readAsText(file,'UTF-8');
       
          reader.addEventListener("load", () => {
              var r = reader.result;

              var r_lines = r.split("\n");
              const regex_comment = /^\s*#/;
              var result_data = [];
              for (let i = 0; i < r_lines.length; i++) {
                if (r_lines[i].match(regex_comment)) {
                  continue;
                }
                result_data.push(r_lines[i]);
              }

              this.setState({ file_read : result_data });
              const result_data_joined = result_data.join(" %% ");
              document.cookie="resultData=" + result_data_joined + "; SameSite=None; Secure";
          });

        this.setState({ value : StateApp.Config });
      };
  

    fileData = () => {    
        if (this.state.selectedFile) {
           
          return (
            <div>
              <h2>File Details:</h2>
               
                <p>File Name: {this.state.selectedFile.name}</p>
                <p>File Type: {this.state.selectedFile.type}</p>
   
            </div>
          );
        } else {
          return (
            <div>
              <br />
              <h4>Choose before Pressing the Upload button</h4>
            </div>
          );
        }
    };

    handleBackButton = event => {
      this.setState({ value : StateApp.MainApp });
    };

    handleSemanticsButton = event => {
      event.preventDefault();
      if (!this.state.sync && !this.state.async) {
        // TODO chyba aspon jedno musi byt
        return;
      }
      this.setState({ option : this.state.node ? 1 : 2 });
    };

    handleNodesButton = event => {
      event.preventDefault();
      this.render();

      this.setState({ compute : true });

      if (this.state.params !== undefined) {
        this.state.params.forEach((value, key) => {
           
          var args_concat = '';
          var args = value["args"].split(',');
          for (var i = 0; i < args.length; ++i) {
            if (args_concat.length > 0) {
              args_concat += " " + param_arguments[key][ i - 1 ] + " ";
            }
            args_concat += args[i];
          }

          const expresion_arr = value["expr"].split("___parametrization___");
          var expr_snd = '';
          if (expresion_arr.length > 1) {
            expr_snd = expresion_arr[1];
          }

          const line = "$" + key + " : " + expresion_arr[0] + " " + args_concat + " " + expr_snd;
          this.state.file_read.push(line);
        });
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


    render() {
        if (this.state.value === StateApp.MainApp) {
          return <App />;
        }

        if (this.state.value === StateApp.Visualise) {

          // Ask to save data
          const clusters_parsed = JSON.parse(this.state.clusters);

          if (this.state.asked === true) {
            return <Visualise fileData={clusters_parsed} />;
          }
          return (
            <div>
              <h3>Do you want to save json file before visualisation?</h3>
              <br/>
              <button onClick={this.handleSave}>Yes</button>
              <button onClick={this.handleNoSave}>No, only visualise</button>

            </div>
          );
        }  
        
        if (this.state.value === StateApp.Config) {

          if (this.state.option === null) {
            return (
            <form>
              <input type="checkbox" id="async" name="semantics" value="1" onChange={event => this.setState({async : true})}/>
              <label for="async">Async</label>
              <input type="checkbox" id="sync" name="semantics" value="2" onChange={event => this.setState({sync : true})}/>
              <label for="sync">Sync</label>
              <br/>
              <input type="radio" id="node" name="option" value="1" onChange={event => this.setState({node : true, whole: false})}/>
              <label for="node">from one node</label>
              <input type="radio" id="whole" name="option" value="2" onChange={event => this.setState({whole : true, node: false})}/>
              <label for="whole">whole state space</label>
              <input type="submit" value="Send" onClick={this.handleSemanticsButton} />
            </form>);
          }

          if (this.state.option === 1 && !this.state.nodes) {
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

          if (this.state.option === 1 && this.state.nodes && this.state.compute === false) {
            var parametrization_selection;
            if (this.state.params !== undefined) {
  
              var lis = [];
              this.state.params.forEach((value, name) => {
                const args = value["args"].split(',');
                const choose_param = choose_parametrization(this.handleParams, args, this.state.reguls, this.state.nodes, name);
  
                if (param_arguments[name] === undefined) {
                  param_arguments[name] = args.map( arg => "&" );
                  param_arguments[name].pop();
                }
  
                const expresion_arr = value["expr"].split("___parametrization___");
                var expr_snd = '';
                if (expresion_arr.length > 1) {
                  expr_snd = expresion_arr[1];
                }
  
                lis.push(<li key={name}> {name}: {expresion_arr[0]}&nbsp;{choose_param}&nbsp;{expr_snd}</li>);
              });
  
              parametrization_selection = <div className="App">
                                            <h3>Select parametrizations</h3>
                                              <ul>
                                              {
                                                lis.map(li => {
                                                  return li;
                                                })
                                              }
                                              </ul>
                                          </div>
            }

            if (!this.state.parsed_nodes_keys) {
              const nodes_keys = Object.keys(this.state.nodes);
              this.setState({parsed_nodes_keys : nodes_keys});
            }

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
            const result_data_joined = this.state.file_read.join(" %% ");
            document.cookie = "resultData=" + result_data_joined + "; SameSite=None; Secure";

            const nodes = this.state.checked_nodes.join(',');
            const params = "semantics=" + (this.state.async ? (this.state.sync ? "async,sync" : "async") : "sync")
                          + "&option=" + this.state.option
                          + (nodes !== "" ? "&nodes=" + nodes : "");

            axios
              .get("http://127.0.0.1:8000/get_data?" + params)
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

        return (
            <div>
                <h3>
                  File Upload
                </h3>
                <div>
                    <input type="file" onChange={this.onFileChange} accept=".aeon"/>
                    <button onClick={this.onFileUpload}>
                      Process
                    </button>
                </div>
              {this.fileData()}

              <input type="submit" value="Back" onClick={this.handleBackButton} />
            </div>
          );
    }
}
