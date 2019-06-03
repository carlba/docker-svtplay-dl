import sys
import time
from typing import Optional

import click
from click.testing import CliRunner
import sh
# noinspection PyUnresolvedReferences
from sh import svtplay_dl, ls


def is_debugging():
    return not (sys.gettrace() is None)


def monitor(svtplay_dl_outpath: str, svtplay_dl_season_urls: [] = None,
            svtplay_dl_episode_urls: [] = None):

    while True:
        try:
            if svtplay_dl_season_urls:
                click.echo(f'Trying to download these season URLs {svtplay_dl_season_urls}')
                svtplay_dl('--output', svtplay_dl_outpath, '-A', '--remux',
                           *svtplay_dl_season_urls, _fg=True)

            if svtplay_dl_episode_urls:
                click.echo(f'Trying to download these episode URLs {svtplay_dl_episode_urls}')
                svtplay_dl('--output', svtplay_dl_outpath, '--remux',
                           *svtplay_dl_episode_urls, _fg=True)
        except sh.ErrorReturnCode as err:
            click.echo(err)
            click.echo(err.stderr)
        finally:
            click.echo(f'Finished downloading trying again in {60*30} seconds')
            time.sleep(60*30)


@click.command()
@click.argument('svtplay_dl_outpath', envvar='SVTPLAY_DL_OUTPATH', required=False,
                default=None)
@click.argument('svtplay_dl_season_urls', envvar='SVTPLAY_DL_SEASON_URLS', required=False,
                default=None)
@click.argument('svtplay_dl_episode_urls', envvar='SVTPLAY_DL_EPISODE_URLS')
def main(svtplay_dl_outpath: str, svtplay_dl_season_urls: Optional[str],
         svtplay_dl_episode_urls: Optional[str]):
    """Console script for docker-svtplay-dl"""

    dl_season_list, dl_episode_list = None, None

    if svtplay_dl_season_urls:
        dl_season_list = [x.strip()
                          for x in svtplay_dl_season_urls.split(',')] or [svtplay_dl_season_urls]
    if svtplay_dl_episode_urls:
        dl_episode_list = [x.strip()
                           for x in svtplay_dl_episode_urls.split(',')] or [svtplay_dl_episode_urls]

    monitor(svtplay_dl_outpath, dl_season_list, dl_episode_list)


if __name__ == "__main__":
    if is_debugging():
        runner = CliRunner()
        runner.invoke(main)
    else:
        main()
