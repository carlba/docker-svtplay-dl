FROM python:3-alpine

RUN apk --no-cache add ffmpeg git zip make gcc \
                       libc-dev musl-dev \
                       libffi-dev openssl-dev

RUN addgroup --gid 500 svtplay-dl && \
    adduser -G svtplay-dl -u 500 --disabled-password svtplay-dl && \
    install -d -o svtplay-dl -g svtplay-dl /output

WORKDIR /home/svtplay-dl
USER svtplay-dl

RUN echo $PATH

ADD run.py ./
ADD requirements.txt ./

USER root
RUN git clone https://github.com/spaam/svtplay-dl.git
RUN cd svtplay-dl && make && make install && \
    cd .. && pip install -r requirements.txt
RUN chown -R svtplay-dl:svtplay-dl ../svtplay-dl
USER svtplay-dl

VOLUME /output
CMD cd /home/svtplay-dl && SVTPLAY_DL_OUTPATH=/output/ python /home/svtplay-dl/run.py

