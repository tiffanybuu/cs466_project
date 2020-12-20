# Nussinov Algorithm

Given an RNA sequence, the Nussinov Algorithm finds a pseudo-knot free RNA secondary structure by maximizing the number of complementary base pairings in the sequence. In the version we implemented, a minimum hairpin loop parameter can also be provided, which enforces a minimum length of nucleotides between pairings to better simulate the real world.

### Interactive Visualizer:  https://nussinov.vercel.app
<br>

## Usage (locally)

### Backend
1. Install the python dependencies by running
```
pip install -r requirements.txt
```
or
```
conda install --file requirements.txt
```
2. Run the Flask server
```
flask run
```
3. To use the API standalone, send a request to `/?rna=[RNA strand]&minloop=[minimum hairpin loop length]`. Or proceed to run the frontend.

### Frontend
1. Install the dependencies
```
npm install
```
2. Start the app
```
npm start
```
3. (optional) To build a production ready app, run
```
npm run build
```
