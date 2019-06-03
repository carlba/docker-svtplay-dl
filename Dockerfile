FROM python:3

RUN apt-get update && apt-get -y install ffmpeg git zip && apt-get clean

RUN groupadd --gid 100 svtplay-dl && \
    useradd --gid 100 --uid 1000 --create-home svtplay-dl

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

