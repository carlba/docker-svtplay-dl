import sys
import time

import click
from click.testing import CliRunner
import sh
# noinspection PyUnresolvedReferences
from sh import svtplay_dl, ls


def is_debugging():
    return not (sys.gettrace() is None)


def monitor(svtplay_dl_outpath: str, svtplay_dl_urls: []):

    while True:
        click.echo(f'Trying to download these URLs {svtplay_dl_urls}')
        try:
            svtplay_dl('--output', svtplay_dl_outpath, '-A', '--remux', *svtplay_dl_urls, _fg=True)
        except sh.ErrorReturnCode as err:
            click.echo(err)
            click.echo(err.stderr)

        finally:
            click.echo(f'Finished downloading trying again in {60*30} seconds')
            time.sleep(60*30)


@click.command()
@click.argument('svtplay_dl_outpath', envvar='SVTPLAY_DL_OUTPATH')
@click.argument('svtplay_dl_urls', envvar='SVTPLAY_DL_URLS')
def main(svtplay_dl_outpath: str, svtplay_dl_urls: str):
    """Console script for docker-svtplay-dl"""

    svtplay_dl_urls_list = [x.strip() for x in svtplay_dl_urls.split(',')] or [svtplay_dl_urls]
    monitor(svtplay_dl_outpath, svtplay_dl_urls_list)


if __name__ == "__main__":
    if is_debugging():
        runner = CliRunner()
        runner.invoke(main)
    else:
        main()
