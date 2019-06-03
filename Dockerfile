FROM python:3-alpine

#RUN apt-get update && \
#    apt-get -y install software-properties-common && \
#    add-apt-repository ppa:jonathonf/ffmpeg-4 && \
#    apt-get update && apt-get -y install ffmpeg git zip && apt-get clean

RUN apk add ffmpeg git zip make gcc libc-dev musl-dev libffi-dev openssl-dev

RUN addgroup --gid 500 svtplay-dl && \
    adduser -G svtplay-dl -u 500 --disabled-password svtplay-dl

WORKDIR /home/svtplay-dl
USER svtplay-dl

RUN echo $PATH

ADD run.py ./
ADD requirements.txt ./

USER root
RUN git clone https://github.com/spaam/svtplay-dl.git
RUN cd svtplay-dl && make && make install && cd .. && pip install -r requirements.txt
RUN chown -R svtplay-dl:svtplay-dl ../svtplay-dl
USER svtplay-dl

## TODO: Change this to /output
VOLUME /home/svtplay-dl/output
CMD cd /home/svtplay-dl && python /home/svtplay-dl/run.py

