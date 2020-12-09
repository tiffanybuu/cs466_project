from flask import Flask, request
import json
from NussinovAlgorithmWithTesting import *

app = Flask(__name__)

@app.route('/')
def home():
  return '<a href="/nussinov">/nussinov</a>'

@app.route('/nussinov')
def compute_nussinov():
  if 'rna' in request.args:
    rna_strand = request.args.get('rna')
  else:
    return 'Error: No RNA strand specified for query parameter "rna"', 400
  
  loop_parameter = request.args.get('minloop', default='0')
  if not loop_parameter.isdigit():
    return 'Error: Minimum loop length parameter "minloop" must be a non-negative integer (0 by default)', 400
  loop_parameter = int(loop_parameter)

  dp_table, max_score, pairings, dash_structure = nussinov(rna_strand, loop_parameter)
  result = {
    "dpTable": dp_table,
    "maxScore": max_score,
    "pairings": pairings,
    "dashStructure": dash_structure,
  }
  return json.dumps(result), 200, {'Content-Type':'application/json'}
