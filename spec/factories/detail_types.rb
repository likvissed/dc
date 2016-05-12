FactoryGirl.define do

  factory :detail_type do
    sequence(:name) { |i| "Type_#{i}" }
  end

  factory :invalid_detail_type, parent: :detail_type do
    name ""
  end

end
