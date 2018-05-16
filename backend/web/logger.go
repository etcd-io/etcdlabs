package web

import "go.uber.org/zap"

var lg *zap.SugaredLogger

func init() {
	l, err := zap.NewProduction()
	if err != nil {
		panic(err)
	}
	lg = l.Sugar()
}
