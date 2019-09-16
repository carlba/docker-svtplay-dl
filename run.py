import os
import sys
import time
from typing import Optional
from urllib.parse import urlparse

import click
from click.testing import CliRunner
import sh
# noinspection PyUnresolvedReferences
from sh import svtplay_dl, ls
import requests


SVTPLAY_DL_EXCLUDES = 'teckentolkat'
RETRY_TIMEOUT = 60*30


def is_debugging():
    return not (sys.gettrace() is None)


def update_plex_library(plex_url, plex_token, plex_library_section):
    result = requests.get(f'http://{plex_url}:32400/library/sections/'
                          f'{plex_library_section}/refresh',
                          params={'X-Plex-Token': plex_token})
    # TODO: Better output of the Plex request
    return result


def validate_link(url) -> bool:
    result = requests.get(url)
    return result.status_code == 200


def parse_media_name_from_url(url):
    return urlparse(url).path.split('/')[-1].strip('/')


def download_url(url: str, download_path: str,
                 svtplay_dl_params: list = None) -> Optional[sh.RunningCommand]:
    parsed_url_path = parse_media_name_from_url(url)
    out_path = os.path.join(download_path, parsed_url_path, '')

    click.echo(f'Trying to download {parsed_url_path}:{url}:{out_path}')

    if not validate_link(url):
        click.echo(f'Unable to access {out_path}', sys.stderr)
        return None

    # noinspection PyUnusedLocal
    return svtplay_dl('--output', out_path, *svtplay_dl_params, '--remux',
                      '--exclude', SVTPLAY_DL_EXCLUDES, url,
                      _bg=True, _in=sys.stdin, _iter='err')


def monitor(svtplay_dl_outpath: str, svtplay_dl_season_urls: [] = None,
            svtplay_dl_episode_urls: [] = None, svtplay_dl_plex_url: str = None,
            svtplay_dl_plex_token: str = None, svtplay_dl_plex_library_section: str = None):

    while True:
        try:
            refresh_needed = False
            if svtplay_dl_season_urls:
                for url in svtplay_dl_season_urls:
                    download = download_url(url, svtplay_dl_outpath, ['-A'])
                    if not download:
                        continue
                    for line in download:
                        sys.stderr.write(line)
                        if 'Muxing done, removing the old file.' in line:
                            refresh_needed = True

            if svtplay_dl_episode_urls:
                for url in svtplay_dl_episode_urls:
                    download = download_url(url, svtplay_dl_outpath)
                    if not download:
                        continue
                    for line in download:
                        sys.stderr.write(line)
                        if 'Muxing done, removing the old file.' in line:
                            refresh_needed = True

            if refresh_needed and all([svtplay_dl_plex_token, svtplay_dl_plex_url,
                                       svtplay_dl_plex_library_section]):

                update_plex_library(svtplay_dl_plex_url,
                                    svtplay_dl_plex_token,
                                    svtplay_dl_plex_library_section)

        except sh.ErrorReturnCode as err:
            click.echo(err)
            click.echo(err.stderr)
        finally:
            click.echo(f'Finished downloading trying again in {RETRY_TIMEOUT} seconds')
            time.sleep(RETRY_TIMEOUT)


@click.command()
@click.argument('svtplay_dl_outpath', envvar='SVTPLAY_DL_OUTPATH', required=False,
                default=None)
@click.argument('svtplay_dl_season_urls', envvar='SVTPLAY_DL_SEASON_URLS', required=False,
                default=None)
@click.argument('svtplay_dl_episode_urls', envvar='SVTPLAY_DL_EPISODE_URLS', required=False)
@click.argument('svtplay_dl_plex_token', envvar='SVTPLAY_DL_PLEX_TOKEN', required=False)
@click.argument('svtplay_dl_plex_url', envvar='SVTPLAY_DL_PLEX_URL', required=False)
@click.argument('svtplay_dl_plex_library_section', envvar='SVTPLAY_DL_PLEX_LIBRARY_SECTION',
                required=False)
def main(svtplay_dl_outpath: str, svtplay_dl_season_urls: Optional[str],
         svtplay_dl_episode_urls: Optional[str], svtplay_dl_plex_token: Optional[str],
         svtplay_dl_plex_url: Optional[str], svtplay_dl_plex_library_section: Optional[str]):
    """Console script for docker-svtplay-dl"""

    dl_season_list, dl_episode_list = None, None

    if svtplay_dl_season_urls:
        dl_season_list = [x.strip()
                          for x in svtplay_dl_season_urls.split(',')] or [svtplay_dl_season_urls]
    if svtplay_dl_episode_urls:
        dl_episode_list = [x.strip()
                           for x in svtplay_dl_episode_urls.split(',')] or [svtplay_dl_episode_urls]

    monitor(svtplay_dl_outpath, dl_season_list, dl_episode_list,
            svtplay_dl_plex_url, svtplay_dl_plex_token,
            svtplay_dl_plex_library_section)


if __name__ == "__main__":
    if is_debugging():
        runner = CliRunner()
        runner.invoke(main)
    else:
        main()
