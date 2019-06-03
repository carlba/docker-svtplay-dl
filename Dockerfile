FROM python:3

RUN apt-get update && apt-get -y install ffmpeg git zip && apt-get clean


WORKDIR /app

ADD run.py ./
ADD requirements.txt ./

RUN git clone https://github.com/spaam/svtplay-dl.git
RUN cd svtplay-dl && make && make install && cd .. && pip install -r requirements.txt


CMD python /app/run.py

