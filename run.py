import sys

import click
from click.testing import CliRunner
import sh
# noinspection PyUnresolvedReferences
from sh import svtplay_dl, ls


def is_debugging():
    return not (sys.gettrace() is None)


@click.command()
@click.argument('svtplay_dl_outpath', envvar='SVTPLAY_DL_OUTPATH')
@click.argument('svtplay_dl_urls', envvar='SVTPLAY_DL_URLS')
def main(svtplay_dl_outpath: str, svtplay_dl_urls: str):
    """Console script for docker-svtplay-dl"""

    svtplay_dl_urls_list = [x.strip() for x in svtplay_dl_urls.split(',')] or [svtplay_dl_urls]
    print (" ".join(svtplay_dl_urls_list))

    try:
        svtplay_dl('--output', svtplay_dl_outpath, '--remux', *svtplay_dl_urls_list, _fg=True)
    except sh.ErrorReturnCode as err:
        print(err)
        print(err.stderr)


if __name__ == "__main__":
    if is_debugging():
        runner = CliRunner()
        runner.invoke(main)
    else:
        main()
