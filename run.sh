docker build -t cashharbor .

docker stop cashharbor
docker rm cashharbor

docker run -d -p 80:80 -p 8000:8000 --name cashharbor --env-file .env cashharbor
