#!/bin/bash

# ==============================================
# 기능별 부하 테스트 스크립트 v2.0
# 사용법: ./load-test.sh [기능] [요청수] [동시성]
# 예: ./load-test.sh posts 100 10
# ==============================================

FEATURE=${1:-all}
REQUESTS=${2:-100}
CONCURRENT=${3:-10}
BASE_URL="http://localhost:3000"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 통계 변수
SUCCESS_COUNT=0
ERROR_COUNT=0
declare -A ERROR_TYPES

echo "======================================"
echo "🚀 기능별 부하 테스트 v2.0"
echo "======================================"
echo "테스트 기능: $FEATURE"
echo "총 요청 수: $REQUESTS"
echo "동시 요청 수: $CONCURRENT"
echo "대상 서버: $BASE_URL"
echo "======================================"
echo ""

# 토큰 가져오기
echo -e "${BLUE}[준비] 인증 토큰 발급 중...${NC}"

TOKEN_RESPONSE=$(echo '{"email":"test@example.com","password":"test1234"}' | \
  curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d @-)

# 로그인 실패 시 회원가입
if echo "$TOKEN_RESPONSE" | grep -q "error\|Unauthorized\|Cannot"; then
  echo -e "${YELLOW}테스트 계정이 없습니다. 회원가입 중...${NC}"

  SIGNUP_RESPONSE=$(echo '{"email":"test@example.com","password":"test1234","username":"loadtest","nickname":"부하테스트"}' | \
    curl -s -X POST $BASE_URL/auth/signup -H "Content-Type: application/json" -d @-)

  if echo "$SIGNUP_RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ 회원가입 실패:${NC}"
    echo "$SIGNUP_RESPONSE"
    exit 1
  fi

  echo -e "${GREEN}✓ 회원가입 성공${NC}"

  # 재로그인
  TOKEN_RESPONSE=$(echo '{"email":"test@example.com","password":"test1234"}' | \
    curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d @-)
fi

# 토큰 추출 (access_token 필드명 사용)
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 토큰 발급 실패:${NC}"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ 인증 토큰 발급 완료${NC}"
echo ""

# 게시글 목록 조회 테스트
test_posts_list() {
  echo -e "${BLUE}[1/6] 게시글 목록 조회 부하 테스트${NC}"

  # 임시 파일로 결과 수집
  TEMP_FILE=$(mktemp)

  for i in $(seq 1 $CONCURRENT); do
    (
      for j in $(seq 1 $((REQUESTS / CONCURRENT))); do
        PAGE=$((RANDOM % 10 + 1))
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
          "$BASE_URL/posts?page=$PAGE&limit=10" \
          -H "Authorization: Bearer $TOKEN")
        echo "$HTTP_CODE" >> "$TEMP_FILE"
        echo -n "."
      done
    ) &
  done
  wait

  # 결과 집계
  while read code; do
    if [ "$code" = "200" ] || [ "$code" = "201" ]; then
      ((SUCCESS_COUNT++))
    else
      ((ERROR_COUNT++))
      ERROR_TYPES[$code]=$((${ERROR_TYPES[$code]:-0} + 1))
    fi
  done < "$TEMP_FILE"
  rm -f "$TEMP_FILE"

  echo -e "\n${GREEN}✓ 완료${NC}\n"
}

# 게시글 상세 조회 테스트
test_posts_detail() {
  echo -e "${BLUE}[2/6] 게시글 상세 조회 부하 테스트${NC}"

  # 게시글 ID 추출 (posts 배열에서만, author.id 제외) - JWT 토큰 필요
  POST_RESPONSE=$(curl -s "$BASE_URL/posts?page=1&limit=10" -H "Authorization: Bearer $TOKEN")

  # Python으로 정확히 게시글 ID만 추출
  POST_IDS=$(echo "$POST_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join([p['id'] for p in d.get('posts', [])]))" 2>/dev/null)
  POST_ARRAY=($POST_IDS)
  TOTAL_POSTS=${#POST_ARRAY[@]}

  if [ $TOTAL_POSTS -eq 0 ]; then
    echo -e "${YELLOW}⚠ 게시글이 없습니다. 테스트 게시글을 생성하세요.${NC}\n"
    return
  fi

  EXISTING_POST="${POST_ARRAY[0]}"
  TEMP_FILE=$(mktemp)

  for i in $(seq 1 $CONCURRENT); do
    (
      for j in $(seq 1 $((REQUESTS / CONCURRENT))); do
        # 랜덤하게 실제 게시글 조회 (배열에서 선택)
        RAND_INDEX=$((RANDOM % TOTAL_POSTS))
        RAND_POST="${POST_ARRAY[$RAND_INDEX]}"
        if [ -z "$RAND_POST" ]; then
          RAND_POST="$EXISTING_POST"
        fi
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
          "$BASE_URL/posts/$RAND_POST" \
          -H "Authorization: Bearer $TOKEN")
        echo "$HTTP_CODE" >> "$TEMP_FILE"
        echo -n "."
      done
    ) &
  done
  wait

  while read code; do
    if [ "$code" = "200" ] || [ "$code" = "201" ]; then
      ((SUCCESS_COUNT++))
    else
      ((ERROR_COUNT++))
      ERROR_TYPES[$code]=$((${ERROR_TYPES[$code]:-0} + 1))
    fi
  done < "$TEMP_FILE"
  rm -f "$TEMP_FILE"

  echo -e "\n${GREEN}✓ 완료${NC}\n"
}

# 사용자 프로필 조회 테스트
test_users_profile() {
  echo -e "${BLUE}[3/6] 사용자 프로필 조회 부하 테스트${NC}"

  # 실제 사용자 UUID 목록 가져오기 (authorId 필드 사용) - JWT 토큰 필요
  USER_LIST_RESPONSE=$(curl -s "$BASE_URL/posts?page=1&limit=20" -H "Authorization: Bearer $TOKEN")
  USER_IDS=$(echo "$USER_LIST_RESPONSE" | grep -o '"authorId":"[^"]*"' | cut -d'"' -f4 | sort -u)

  if [ -z "$USER_IDS" ]; then
    echo -e "${YELLOW}⚠ 사용자를 찾을 수 없습니다. 스킵${NC}\n"
    return
  fi

  # 배열로 변환
  USER_ARRAY=($USER_IDS)
  TOTAL_USERS=${#USER_ARRAY[@]}

  if [ $TOTAL_USERS -eq 0 ]; then
    echo -e "${YELLOW}⚠ 사용자를 찾을 수 없습니다. 스킵${NC}\n"
    return
  fi

  TEMP_FILE=$(mktemp)

  for i in $(seq 1 $CONCURRENT); do
    (
      for j in $(seq 1 $((REQUESTS / CONCURRENT))); do
        # 랜덤하게 사용자 선택
        RAND_INDEX=$((RANDOM % TOTAL_USERS))
        USER_ID="${USER_ARRAY[$RAND_INDEX]}"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
          "$BASE_URL/users/$USER_ID" \
          -H "Authorization: Bearer $TOKEN")
        echo "$HTTP_CODE" >> "$TEMP_FILE"
        echo -n "."
      done
    ) &
  done
  wait

  while read code; do
    if [ "$code" = "200" ] || [ "$code" = "201" ]; then
      ((SUCCESS_COUNT++))
    else
      ((ERROR_COUNT++))
      ERROR_TYPES[$code]=$((${ERROR_TYPES[$code]:-0} + 1))
    fi
  done < "$TEMP_FILE"
  rm -f "$TEMP_FILE"

  echo -e "\n${GREEN}✓ 완료${NC}\n"
}

# 댓글 조회 테스트
test_comments() {
  echo -e "${BLUE}[4/6] 댓글 조회 부하 테스트${NC}"

  POST_RESPONSE=$(curl -s "$BASE_URL/posts?page=1&limit=5" -H "Authorization: Bearer $TOKEN")
  EXISTING_POST=$(echo "$POST_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$EXISTING_POST" ]; then
    echo -e "${YELLOW}⚠ 게시글이 없습니다. 스킵${NC}\n"
    return
  fi

  TEMP_FILE=$(mktemp)

  for i in $(seq 1 $CONCURRENT); do
    (
      for j in $(seq 1 $((REQUESTS / CONCURRENT))); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
          "$BASE_URL/posts/$EXISTING_POST/comments" \
          -H "Authorization: Bearer $TOKEN")
        echo "$HTTP_CODE" >> "$TEMP_FILE"
        echo -n "."
      done
    ) &
  done
  wait

  while read code; do
    if [ "$code" = "200" ] || [ "$code" = "201" ]; then
      ((SUCCESS_COUNT++))
    else
      ((ERROR_COUNT++))
      ERROR_TYPES[$code]=$((${ERROR_TYPES[$code]:-0} + 1))
    fi
  done < "$TEMP_FILE"
  rm -f "$TEMP_FILE"

  echo -e "\n${GREEN}✓ 완료${NC}\n"
}

# 스토리 조회 테스트
test_stories() {
  echo -e "${BLUE}[5/6] 스토리 조회 부하 테스트${NC}"

  TEMP_FILE=$(mktemp)

  for i in $(seq 1 $CONCURRENT); do
    (
      for j in $(seq 1 $((REQUESTS / CONCURRENT))); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
          "$BASE_URL/stories" \
          -H "Authorization: Bearer $TOKEN")
        echo "$HTTP_CODE" >> "$TEMP_FILE"
        echo -n "."
      done
    ) &
  done
  wait

  while read code; do
    if [ "$code" = "200" ] || [ "$code" = "201" ]; then
      ((SUCCESS_COUNT++))
    else
      ((ERROR_COUNT++))
      ERROR_TYPES[$code]=$((${ERROR_TYPES[$code]:-0} + 1))
    fi
  done < "$TEMP_FILE"
  rm -f "$TEMP_FILE"

  echo -e "\n${GREEN}✓ 완료${NC}\n"
}

# 혼합 부하 테스트
test_mixed() {
  echo -e "${BLUE}[6/6] 혼합 부하 테스트 (실제 사용 패턴)${NC}"

  # 실제 게시글 및 사용자 UUID 목록 가져오기 (Python으로 정확히 추출) - JWT 토큰 필요
  LIST_RESPONSE=$(curl -s "$BASE_URL/posts?page=1&limit=30" -H "Authorization: Bearer $TOKEN")

  # Python으로 게시글 ID와 작성자 ID를 정확히 추출
  POST_IDS=$(echo "$LIST_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join([p['id'] for p in d.get('posts', [])]))" 2>/dev/null)
  USER_IDS=$(echo "$LIST_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(list(set([p['authorId'] for p in d.get('posts', []) if 'authorId' in p]))))" 2>/dev/null)

  POST_ARRAY=($POST_IDS)
  USER_ARRAY=($USER_IDS)
  TOTAL_POSTS=${#POST_ARRAY[@]}
  TOTAL_USERS=${#USER_ARRAY[@]}

  if [ $TOTAL_POSTS -eq 0 ] || [ $TOTAL_USERS -eq 0 ]; then
    echo -e "${YELLOW}⚠ 데이터가 부족합니다. 스킵${NC}\n"
    return
  fi

  TEMP_FILE=$(mktemp)

  for i in $(seq 1 $CONCURRENT); do
    (
      for j in $(seq 1 $((REQUESTS / CONCURRENT))); do
        RAND=$((RANDOM % 10))
        if [ $RAND -lt 5 ]; then
          # 50%: 게시글 목록 조회
          PAGE=$((RANDOM % 5 + 1))
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            "$BASE_URL/posts?page=$PAGE&limit=10" \
            -H "Authorization: Bearer $TOKEN")
        elif [ $RAND -lt 8 ]; then
          # 30%: 게시글 상세 조회 (실제 UUID 사용)
          RAND_INDEX=$((RANDOM % TOTAL_POSTS))
          POST_ID="${POST_ARRAY[$RAND_INDEX]}"
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            "$BASE_URL/posts/$POST_ID" \
            -H "Authorization: Bearer $TOKEN")
        else
          # 20%: 사용자 프로필 조회 (실제 UUID 사용)
          RAND_INDEX=$((RANDOM % TOTAL_USERS))
          USER_ID="${USER_ARRAY[$RAND_INDEX]}"
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            "$BASE_URL/users/$USER_ID" \
            -H "Authorization: Bearer $TOKEN")
        fi
        echo "$HTTP_CODE" >> "$TEMP_FILE"
        echo -n "."
      done
    ) &
  done
  wait

  while read code; do
    if [ "$code" = "200" ] || [ "$code" = "201" ]; then
      ((SUCCESS_COUNT++))
    else
      ((ERROR_COUNT++))
      ERROR_TYPES[$code]=$((${ERROR_TYPES[$code]:-0} + 1))
    fi
  done < "$TEMP_FILE"
  rm -f "$TEMP_FILE"

  echo -e "\n${GREEN}✓ 완료${NC}\n"
}

# 기능별 테스트 실행
case $FEATURE in
  posts)
    test_posts_list
    test_posts_detail
    ;;
  users)
    test_users_profile
    ;;
  comments)
    test_comments
    ;;
  stories)
    test_stories
    ;;
  mixed)
    test_mixed
    ;;
  all)
    test_posts_list
    test_posts_detail
    test_users_profile
    test_comments
    # test_stories  # 스토리 엔드포인트가 아직 준비되지 않음
    test_mixed
    ;;
  *)
    echo -e "${RED}❌ 알 수 없는 기능: $FEATURE${NC}"
    echo "사용 가능한 기능: posts, users, comments, stories, mixed, all"
    exit 1
    ;;
esac

# 결과 출력
echo "======================================"
echo -e "${YELLOW}📊 부하 테스트 결과${NC}"
echo "======================================"
echo -e "총 요청: $((SUCCESS_COUNT + ERROR_COUNT))"
echo -e "${GREEN}성공: $SUCCESS_COUNT${NC}"
echo -e "${RED}실패: $ERROR_COUNT${NC}"

if [ $ERROR_COUNT -gt 0 ]; then
  echo ""
  echo "에러 상세:"
  for code in "${!ERROR_TYPES[@]}"; do
    echo "  HTTP $code: ${ERROR_TYPES[$code]}개"
  done
fi

TOTAL=$((SUCCESS_COUNT + ERROR_COUNT))
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($SUCCESS_COUNT / $TOTAL) * 100}")
  echo ""
  echo -e "성공률: ${GREEN}$SUCCESS_RATE%${NC}"
fi

echo ""
echo "======================================"
echo "📈 모니터링 확인:"
echo "  - Grafana: http://localhost:3003"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "💡 추천 대시보드 ID:"
echo "  - 14282 (Docker Container)"
echo "  - 1860 (Node Exporter)"
echo "  - 9628 (PostgreSQL)"
echo "  - 11835 (Redis)"
echo "======================================"

